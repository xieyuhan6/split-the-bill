from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()


@router.get("", summary="Health check")
async def health_check() -> dict[str, str | bool]:
    settings = get_settings()
    return {
        "status": "ok",
        "service": settings.app_name,
        "debug": settings.debug,
    }
