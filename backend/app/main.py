import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import resume, jobs, ai

app = FastAPI(title="Job Match API")

# Comma-separated list of allowed origins — set ALLOWED_ORIGINS in Render env vars.
_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
