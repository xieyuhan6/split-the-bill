from fastapi import APIRouter

from app.api.v1.endpoints.calculate import router as calculate_router
from app.api.v1.endpoints.expenses import router as expenses_router
from app.api.v1.endpoints.groups import router as groups_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.members import router as members_router
from app.api.v1.endpoints.rates import router as rates_router
from app.api.v1.endpoints.settlements import router as settlements_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(calculate_router, tags=["calculate"])
api_router.include_router(rates_router, tags=["rates"])
api_router.include_router(groups_router, prefix="/groups", tags=["groups"])
api_router.include_router(members_router, tags=["members"])
api_router.include_router(expenses_router, tags=["expenses"])
api_router.include_router(settlements_router, tags=["settlements"])
