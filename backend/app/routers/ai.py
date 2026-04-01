from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ai_service import generate_cover_letter, rewrite_resume

router = APIRouter()


class CoverLetterRequest(BaseModel):
    profile: dict
    job: dict


class RewriteRequest(BaseModel):
    original_resume_text: str
    job: dict


@router.post("/cover-letter")
async def get_cover_letter(request: CoverLetterRequest):
    try:
        text = await generate_cover_letter(request.profile, request.job)
        return {"cover_letter": text}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Cover letter generation failed: {exc}") from exc


@router.post("/rewrite")
async def get_rewrite(request: RewriteRequest):
    try:
        text = await rewrite_resume(request.original_resume_text, request.job)
        return {"rewritten_resume": text}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Resume rewrite failed: {exc}") from exc
