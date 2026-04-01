from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.resume_parser import extract_text
from app.services.ai_service import parse_resume_profile

router = APIRouter()

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Only PDF and DOCX are allowed.",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10 MB allowed.")

    try:
        text = extract_text(contents, file.content_type)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to extract text: {exc}") from exc

    if not text.strip():
        raise HTTPException(status_code=422, detail="No readable text found in the uploaded file.")

    try:
        profile = await parse_resume_profile(text)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI parsing failed: {exc}") from exc

    return {**profile.model_dump(), "raw_text": text}
