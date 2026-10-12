import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import EvaluationRun, User
from app.schemas.schemas import EvaluationRunRequest, EvaluationRunResponse
from app.api.deps import get_current_user
from app.services.evaluation import evaluation_service

router = APIRouter()

@router.get("/runs")
def get_evaluation_runs(db: Session = Depends(get_db)):
    runs = db.query(EvaluationRun).order_by(EvaluationRun.created_at.desc()).all()
    if not runs:
        return {"status": "Not evaluated yet", "runs": []}

    results = []
    for r in runs:
        results.append({
            "id": r.id,
            "run_name": r.run_name,
            "model_used": r.model_used,
            "status": r.status,
            "metrics": json.loads(r.metrics or "{}"),
            "learner_simulations": json.loads(r.learner_simulations or "{}"),
            "created_at": r.created_at.isoformat()
        })
    return {"status": "Evaluated", "runs": results}

@router.post("/run", response_model=EvaluationRunResponse)
def trigger_benchmark(
    req: EvaluationRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    run_record = evaluation_service.run_benchmark(
        db=db,
        run_name=f"{req.dataset_name or 'Benchmark'} - {current_user.full_name}"
    )

    return EvaluationRunResponse(
        id=run_record.id,
        run_name=run_record.run_name,
        model_used=run_record.model_used,
        status=run_record.status,
        metrics=json.loads(run_record.metrics or "{}"),
        learner_simulations=json.loads(run_record.learner_simulations or "{}"),
        created_at=run_record.created_at
    )

@router.get("/runs/{run_id}", response_model=EvaluationRunResponse)
def get_evaluation_run(run_id: str, db: Session = Depends(get_db)):
    r = db.query(EvaluationRun).filter(EvaluationRun.id == run_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Evaluation run not found.")

    return EvaluationRunResponse(
        id=r.id,
        run_name=r.run_name,
        model_used=r.model_used,
        status=r.status,
        metrics=json.loads(r.metrics or "{}"),
        learner_simulations=json.loads(r.learner_simulations or "{}"),
        created_at=r.created_at
    )
