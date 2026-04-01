import asyncio
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ai_service import ResumeProfile, score_job
from app.services.job_scraper import scrape_jobs

router = APIRouter()


class SearchRequest(BaseModel):
    profile: dict
    location: str
    country: str
    province: Optional[str] = None


@router.post("/search")
async def search_jobs(request: SearchRequest):
    try:
        profile = ResumeProfile(**request.profile)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid profile: {exc}") from exc

    location = (
        f"{request.province}, {request.country}" if request.province else request.country
    )

    loop = asyncio.get_event_loop()
    try:
        jobs = await loop.run_in_executor(
            None,
            lambda: scrape_jobs(
                search_term=profile.search_term or " ".join(profile.job_titles[:1]),
                location=location,
                country=request.country,
            ),
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Job scraping failed: {exc}") from exc

    if not jobs:
        return {"jobs": [], "total": 0}

    semaphore = asyncio.Semaphore(3)

    async def score_with_semaphore(job: dict) -> dict:
        async with semaphore:
            try:
                result = await score_job(profile, job)
                return {**job, "score": result["score"], "score_reason": result["reason"]}
            except Exception:
                return {**job, "score": 0, "score_reason": ""}

    scored = list(await asyncio.gather(*[score_with_semaphore(j) for j in jobs]))
    scored.sort(key=lambda x: x["score"], reverse=True)

    return {"jobs": scored, "total": len(scored)}
