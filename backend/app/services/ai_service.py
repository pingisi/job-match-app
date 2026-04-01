import os
import json
import re
import asyncio
from groq import AsyncGroq, RateLimitError
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from typing import Optional

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Large model for quality tasks (resume parse, cover letter, rewrite)
QUALITY_MODEL = os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")
# Fast model for bulk scoring — 20K TPM limit vs 6K TPM for 70b
SCORING_MODEL = "llama-3.1-8b-instant"

# OpenRouter fallback models (free tier)
OR_SCORING_MODEL  = "meta-llama/llama-3.1-8b-instruct:free"
OR_QUALITY_MODEL  = "meta-llama/llama-3.3-70b-instruct:free"

_groq = AsyncGroq(api_key=GROQ_API_KEY)
_openrouter = AsyncOpenAI(
    api_key=OPENROUTER_API_KEY or "none",
    base_url="https://openrouter.ai/api/v1",
) if OPENROUTER_API_KEY else None


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


async def _groq_generate(prompt: str, use_json_format: bool = False, model: str = QUALITY_MODEL) -> str:
    kwargs: dict = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 1024,
    }
    if use_json_format:
        kwargs["response_format"] = {"type": "json_object"}

    # Determine fallback model for OpenRouter
    or_model = OR_SCORING_MODEL if model == SCORING_MODEL else OR_QUALITY_MODEL

    for attempt in range(3):
        try:
            response = await _groq.chat.completions.create(**kwargs)
            return response.choices[0].message.content or ""
        except RateLimitError:
            # Try OpenRouter fallback if key is configured
            if _openrouter is not None:
                or_kwargs = {**kwargs, "model": or_model}
                if use_json_format:
                    # OpenRouter free models don't support json_object mode
                    or_kwargs.pop("response_format", None)
                try:
                    or_response = await _openrouter.chat.completions.create(**or_kwargs)
                    return or_response.choices[0].message.content or ""
                except Exception:
                    pass  # fall through to backoff
            if attempt == 2:
                raise
            await asyncio.sleep(8 * (attempt + 1))  # 8s, 16s backoff
    return ""


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

    raw = await _groq_generate(prompt, use_json_format=True, model=QUALITY_MODEL)
    data = _extract_json(raw)
    return ResumeProfile(**data)


async def score_job(profile: ResumeProfile, job: dict) -> dict:
    # Keep description short — 8b model, maximise throughput
    description = (job.get("description") or "")[:600]

    prompt = f"""Score 0-100 how well this candidate matches the job. Return JSON only: {{"score": 75, "reason": "one sentence"}}

Candidate skills: {', '.join(profile.skills[:10])}
Candidate roles: {', '.join(profile.job_titles[:3])}
Experience: {profile.years_experience}yr

Job: {job.get('title', '')} at {job.get('company', '')}
{description}"""

    raw = await _groq_generate(prompt, use_json_format=True, model=SCORING_MODEL)
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

    return await _groq_generate(prompt, use_json_format=False, model=QUALITY_MODEL)


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

    return await _groq_generate(prompt, use_json_format=False, model=QUALITY_MODEL)
