import os
import json
import re
from groq import AsyncGroq
from pydantic import BaseModel, Field
from typing import Optional

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MODEL_NAME = os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")

_client = AsyncGroq(api_key=GROQ_API_KEY)


class ResumeProfile(BaseModel):
    skills: list[str] = Field(default_factory=list)
    job_titles: list[str] = Field(default_factory=list)
    years_experience: Optional[int] = None
    education: Optional[str] = None
    summary: str = ""
    search_term: str = ""
    raw_text: Optional[str] = None


def _extract_json(text: str) -> dict:
    """Extract a JSON object from potentially noisy LLM output."""
    stripped = text.strip()
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", stripped, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    match = re.search(r"\{.*\}", stripped, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"No valid JSON found in LLM response: {stripped[:300]}")


async def _groq_generate(prompt: str, use_json_format: bool = False) -> str:
    kwargs: dict = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 2048,
    }
    if use_json_format:
        kwargs["response_format"] = {"type": "json_object"}

    response = await _client.chat.completions.create(**kwargs)
    return response.choices[0].message.content or ""


async def parse_resume_profile(text: str) -> ResumeProfile:
    truncated = text[:6000] if len(text) > 6000 else text

    prompt = f"""You are an expert resume parser. Extract structured information from the resume below.
Return ONLY a valid JSON object with this exact structure, no extra text:
{{
  "skills": ["skill1", "skill2"],
  "job_titles": ["most relevant job title"],
  "years_experience": 5,
  "education": "highest degree and field of study",
  "summary": "2-3 sentence professional summary",
  "search_term": "best single job title to search for (e.g. Data Engineer, Software Developer)"
}}

Resume:
{truncated}"""

    raw = await _groq_generate(prompt, use_json_format=True)
    data = _extract_json(raw)
    return ResumeProfile(**data)


async def score_job(profile: ResumeProfile, job: dict) -> dict:
    description = (job.get("description") or "")[:2000]

    prompt = f"""You are a job matching expert. Rate how well this candidate matches the job posting.
Return ONLY a valid JSON object:
{{"score": 75, "reason": "Brief 1-2 sentence explanation of the match"}}

Candidate:
- Skills: {", ".join(profile.skills[:20])}
- Roles: {", ".join(profile.job_titles[:5])}
- Experience: {profile.years_experience} years
- Education: {profile.education}
- Summary: {profile.summary}

Job: {job.get("title", "")} at {job.get("company", "")}
Description: {description}

Score 0-100 (100 = perfect match). Return JSON only."""

    raw = await _groq_generate(prompt, use_json_format=True)
    data = _extract_json(raw)
    score = max(0, min(100, int(data.get("score", 0))))
    return {"score": score, "reason": data.get("reason", "")}


async def generate_cover_letter(profile: dict, job: dict) -> str:
    description = (job.get("description") or "")[:2000]

    prompt = f"""Write a professional, compelling 3-paragraph cover letter for this job application.
Be specific, enthusiastic, and highlight the most relevant experience. Do not include a return address or subject line — start directly with the salutation.

Candidate:
- Summary: {profile.get("summary", "")}
- Key Skills: {", ".join((profile.get("skills") or [])[:15])}
- Experience: {profile.get("years_experience", "")} years
- Education: {profile.get("education", "")}

Target Position: {job.get("title", "")} at {job.get("company", "")}
Job Description: {description}

Cover Letter:"""

    return await _groq_generate(prompt, use_json_format=False)


async def rewrite_resume(original_text: str, job: dict) -> str:
    description = (job.get("description") or "")[:2000]
    truncated_resume = original_text[:4000] if len(original_text) > 4000 else original_text

    prompt = f"""Rewrite the resume below to better match the target job.
Rules:
- Keep all factual information (company names, dates, schools, titles) EXACTLY the same.
- Improve: language, keywords, action verbs, and emphasis to align with job requirements.
- Add relevant keywords from the job description where they truthfully apply.

Target Position: {job.get("title", "")} at {job.get("company", "")}
Job Requirements: {description}

Original Resume:
{truncated_resume}

Rewritten Resume:"""

    return await _groq_generate(prompt, use_json_format=False)
