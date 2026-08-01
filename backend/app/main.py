from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.openapi import OPENAPI_TAGS, configure_openapi
from app.routers.a2p import router as a2p_router
from app.routers.bfsi import router as bfsi_router
from app.routers.bfsi_v1 import v1_router as bfsi_v1_router
from app.routers.bfsi_v2 import v2_router as bfsi_v2_router
from app.routers.chat import router as chat_router
from app.routers.movies import router as movies_router
from app.routers.tasks import router as tasks_router
from app.services.bfsi.database import init_db as init_bfsi_db
from app.services.movies.database import init_db
from app.services.tasks.database import init_db as init_tasks_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    init_bfsi_db()
    init_tasks_db()
    yield


app = FastAPI(
    title="Portfolio API",
    description="Portfolio assistants API for arundas.me",
    version="0.3.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=OPENAPI_TAGS,
)

configure_openapi(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(a2p_router)
app.include_router(movies_router)
app.include_router(tasks_router)
app.include_router(bfsi_router)
app.include_router(bfsi_v1_router, prefix="/api/bfsi")
app.include_router(bfsi_v2_router, prefix="/api/bfsi")


@app.get("/api/health", include_in_schema=False)
async def health():
    return {
        "status": "ok",
        "openai_configured": settings.openai_configured,
        "model": settings.openai_model,
        "chat_password_required": settings.chat_password_required,
        "tmdb_configured": bool(settings.tmdb_api_key.strip()),
    }
