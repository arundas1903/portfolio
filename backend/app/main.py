from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers.chat import router as chat_router

app = FastAPI(
    title="Portfolio Faith Discuss API",
    description="Multi-faith scripture chat for arundas.me portfolio",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "openai_configured": settings.openai_configured,
        "model": settings.openai_model,
    }
