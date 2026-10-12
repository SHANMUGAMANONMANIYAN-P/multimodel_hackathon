from fastapi import APIRouter
from app.api.routes import auth, materials, tutor, assessments, analytics, evaluation

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(materials.router, prefix="/materials", tags=["Materials & Ingestion"])
api_router.include_router(tutor.router, prefix="/tutor", tags=["AI Tutor"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["Assessments"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Mastery"])
api_router.include_router(evaluation.router, prefix="/evaluation", tags=["Evaluation & Benchmarks"])
