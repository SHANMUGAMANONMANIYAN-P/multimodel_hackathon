import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    User,
    Assessment,
    Question,
    AssessmentAttempt,
    StudentAnswer,
    LearningActivity
)
from app.schemas.schemas import (
    AssessmentGenerateRequest,
    AssessmentResponse,
    QuestionResponse,
    AssessmentSubmitRequest,
    AssessmentResultResponse,
    StudentAnswerReviewResponse,
    TopicMasteryDelta,
    CitationItem
)
from app.api.deps import get_current_user
from app.services.assessment_gen import assessment_service

router = APIRouter()

@router.post("/generate", response_model=AssessmentResponse)
def generate_assessment(
    req: AssessmentGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessment = assessment_service.generate_assessment(
        db=db,
        user=current_user,
        material_id=req.material_id,
        topic_name=req.topic_name,
        difficulty=req.difficulty,
        question_count=req.question_count,
        time_limit_minutes=req.time_limit_minutes
    )

    questions = db.query(Question).filter(Question.assessment_id == assessment.id).all()
    q_responses = []
    for q in questions:
        raw_refs = json.loads(q.source_references or "[]")
        source_refs = [CitationItem(**r) for r in raw_refs]
        q_responses.append(QuestionResponse(
            id=q.id,
            question_text=q.question_text,
            question_type=q.question_type,
            topic_name=q.topic_name,
            difficulty=q.difficulty,
            options=json.loads(q.options or "[]"),
            fingerprint=q.fingerprint,
            source_references=source_refs
        ))

    return AssessmentResponse(
        id=assessment.id,
        title=assessment.title,
        difficulty=assessment.difficulty,
        question_count=assessment.question_count,
        time_limit_minutes=assessment.time_limit_minutes,
        status=assessment.status,
        created_at=assessment.created_at,
        questions=q_responses
    )

@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessment = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.user_id == current_user.id
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    questions = db.query(Question).filter(Question.assessment_id == assessment.id).all()
    q_responses = []
    for q in questions:
        raw_refs = json.loads(q.source_references or "[]")
        source_refs = [CitationItem(**r) for r in raw_refs]
        q_responses.append(QuestionResponse(
            id=q.id,
            question_text=q.question_text,
            question_type=q.question_type,
            topic_name=q.topic_name,
            difficulty=q.difficulty,
            options=json.loads(q.options or "[]"),
            fingerprint=q.fingerprint,
            source_references=source_refs
        ))

    return AssessmentResponse(
        id=assessment.id,
        title=assessment.title,
        difficulty=assessment.difficulty,
        question_count=assessment.question_count,
        time_limit_minutes=assessment.time_limit_minutes,
        status=assessment.status,
        created_at=assessment.created_at,
        questions=q_responses
    )

@router.post("/{assessment_id}/submit", response_model=AssessmentResultResponse)
def submit_assessment(
    assessment_id: str,
    submit_data: AssessmentSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student_answers = [ans.model_dump() for ans in submit_data.answers]
    result = assessment_service.grade_assessment(
        db=db,
        user=current_user,
        assessment_id=assessment_id,
        student_answers=student_answers,
        time_spent_seconds=submit_data.time_spent_seconds
    )

    # Log activity
    db.add(LearningActivity(
        user_id=current_user.id,
        activity_type="assessment",
        title=f"Completed Assessment ({result['percentage']}%)",
        details=json.dumps({"score": result["score"], "max_score": result["max_score"]})
    ))
    db.commit()

    # Build response schemas
    reviewed_answers = []
    for a in result["answers"]:
        source_refs = [CitationItem(**r) for r in a["source_references"]]
        reviewed_answers.append(StudentAnswerReviewResponse(
            question_id=a["question_id"],
            question_text=a["question_text"],
            question_type=a["question_type"],
            student_response=a["student_response"],
            answer_key=a["answer_key"],
            is_correct=a["is_correct"],
            points_awarded=a["points_awarded"],
            feedback=a["feedback"],
            misconception=a["misconception"],
            explanation=a["explanation"],
            source_references=source_refs
        ))

    mastery_updates = [TopicMasteryDelta(**u) for u in result["mastery_updates"]]

    return AssessmentResultResponse(
        attempt_id=result["attempt_id"],
        assessment_id=result["assessment_id"],
        score=result["score"],
        max_score=result["max_score"],
        percentage=result["percentage"],
        time_spent_seconds=result["time_spent_seconds"],
        inferred_misconceptions=result["inferred_misconceptions"],
        answers=reviewed_answers,
        mastery_updates=mastery_updates,
        recommended_revision_topics=result["recommended_revision_topics"],
        suggested_next_activity=result["suggested_next_activity"]
    )

@router.get("/attempts/recent")
def get_recent_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempts = (
        db.query(AssessmentAttempt)
        .filter(AssessmentAttempt.user_id == current_user.id)
        .order_by(AssessmentAttempt.completed_at.desc())
        .limit(10)
        .all()
    )

    results = []
    for att in attempts:
        assessment = db.query(Assessment).filter(Assessment.id == att.assessment_id).first()
        results.append({
            "id": att.id,
            "assessment_id": att.assessment_id,
            "title": assessment.title if assessment else "Quiz",
            "score": att.score,
            "max_score": att.max_score,
            "percentage": att.percentage,
            "time_spent_seconds": att.time_spent_seconds,
            "completed_at": att.completed_at
        })
    return results
