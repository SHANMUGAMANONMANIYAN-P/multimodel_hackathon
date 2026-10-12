import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    User,
    Material,
    AssessmentAttempt,
    TopicMastery,
    TopicMasteryHistory,
    LearningActivity,
    Topic,
    TopicPrerequisite
)
from app.schemas.schemas import DashboardStatsResponse, TopicMasteryResponse
from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStatsResponse)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_materials = db.query(Material).filter(Material.user_id == current_user.id).count()
    quizzes_completed = db.query(AssessmentAttempt).filter(AssessmentAttempt.user_id == current_user.id).count()

    # Aggregate study time (seconds -> minutes)
    total_seconds = 0
    attempts = db.query(AssessmentAttempt.time_spent_seconds).filter(AssessmentAttempt.user_id == current_user.id).all()
    for att in attempts:
        total_seconds += (att[0] or 0)
    study_time_minutes = max(15, total_seconds // 60) if quizzes_completed > 0 else 0

    # Fetch Topic Masteries
    masteries = (
        db.query(TopicMastery)
        .filter(TopicMastery.user_id == current_user.id)
        .order_by(TopicMastery.current_mastery.desc())
        .all()
    )

    topic_responses = [TopicMasteryResponse.model_validate(m) for m in masteries]
    
    if masteries:
        overall_mastery = round(sum(m.current_mastery for m in masteries) / len(masteries), 3)
    else:
        overall_mastery = settings.BKT_DEFAULT_L0

    # Strong vs Weak topics
    strong_topics = [TopicMasteryResponse.model_validate(m) for m in masteries if m.current_mastery >= 0.70]
    weak_topics = [TopicMasteryResponse.model_validate(m) for m in masteries if m.current_mastery < 0.60]

    # Recent activity logs
    activities = (
        db.query(LearningActivity)
        .filter(LearningActivity.user_id == current_user.id)
        .order_by(LearningActivity.created_at.desc())
        .limit(8)
        .all()
    )
    activity_list = [
        {
            "id": a.id,
            "type": a.activity_type,
            "title": a.title,
            "created_at": a.created_at.isoformat()
        }
        for a in activities
    ]

    # Smart pedagogical recommendation
    if weak_topics:
        rec = f"Review prerequisite concepts for '{weak_topics[0].topic_name}' using AI Tutor, then attempt an adaptive quiz."
    elif total_materials == 0:
        rec = "Upload your first PDF textbook, slides, or lecture video to build your source-grounded knowledge base."
    elif quizzes_completed == 0:
        rec = "Take a diagnostic adaptive quiz on your uploaded course concepts to establish your initial mastery baseline."
    else:
        rec = "You have high mastery across current units! Move on to advanced problem sets or upload the next lecture chapter."

    ai_status = {
        "provider": "Google Gemini" if settings.GEMINI_API_KEY else "Local Extractive RAG",
        "model": settings.AI_MODEL if settings.GEMINI_API_KEY else "Deterministic Semantic Engine",
        "connected": bool(settings.GEMINI_API_KEY),
        "embedding": settings.EMBEDDING_MODEL if settings.GEMINI_API_KEY else "Local 384-dim Semantic Projection",
        "mode_badge": "Gemini 3.8 Flash Online" if settings.GEMINI_API_KEY else "Local RAG Mode (Deterministic Offline Fallback)"
    }

    return DashboardStatsResponse(
        total_materials=total_materials,
        quizzes_completed=quizzes_completed,
        overall_mastery=overall_mastery,
        study_time_minutes=study_time_minutes,
        topic_masteries=topic_responses,
        weak_topics=weak_topics,
        strong_topics=strong_topics,
        recent_activities=activity_list,
        recommended_next_activity=rec,
        ai_status=ai_status
    )

@router.get("/knowledge-map")
def get_knowledge_map(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    topics = db.query(Topic).all()
    prereqs = db.query(TopicPrerequisite).all()
    user_mastery_map = {
        m.topic_name: m.current_mastery
        for m in db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()
    }

    nodes = []
    for t in topics:
        mastery = user_mastery_map.get(t.name, settings.BKT_DEFAULT_L0)
        state = "MASTERED" if mastery >= 0.85 else "PROFICIENT" if mastery >= 0.70 else "DEVELOPING" if mastery >= 0.40 else "NOVICE"
        nodes.append({
            "id": t.id,
            "name": t.name,
            "category": t.category,
            "mastery": mastery,
            "state": state
        })

    edges = []
    for p in prereqs:
        edges.append({
            "id": p.id,
            "source": p.prerequisite_id,
            "target": p.topic_id,
            "strength": p.strength
        })

    return {"nodes": nodes, "edges": edges}

@router.get("/mastery/history")
def get_mastery_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = (
        db.query(TopicMasteryHistory)
        .filter(TopicMasteryHistory.user_id == current_user.id)
        .order_by(TopicMasteryHistory.created_at.asc())
        .limit(40)
        .all()
    )

    return [
        {
            "id": h.id,
            "topic_name": h.topic_name,
            "prior_mastery": h.prior_mastery,
            "updated_mastery": h.updated_mastery,
            "delta": h.delta,
            "is_correct": h.is_correct,
            "created_at": h.created_at.isoformat()
        }
        for h in history
    ]
