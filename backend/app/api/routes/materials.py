import os
import shutil
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, Material, ExtractedChunk, LearningActivity
from app.schemas.schemas import MaterialResponse, ExtractedChunkResponse
from app.api.deps import get_current_user
from app.services.ingestion import ingestion_pipeline

router = APIRouter()

@router.post("/upload", response_model=MaterialResponse)
async def upload_material(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    original_filename = file.filename or "uploaded_document"
    file_ext = os.path.splitext(original_filename)[1].lower()

    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Determine material type
    if file_ext == ".pdf":
        mat_type = "pdf"
    elif file_ext in [".pptx", ".ppt"]:
        mat_type = "pptx"
    elif file_ext in [".mp4", ".srt", ".vtt"]:
        mat_type = "video"
    else:
        mat_type = "text"

    display_title = title or os.path.splitext(original_filename)[0].replace("_", " ").title()
    save_filename = f"{current_user.id}_{int(os.times().system * 1000)}_{original_filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, save_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    # Create Material record
    material = Material(
        user_id=current_user.id,
        title=display_title,
        original_filename=original_filename,
        file_path=file_path,
        file_type=mat_type,
        file_size=file_size,
        status="pending"
    )
    db.add(material)

    # Log learning activity
    db.add(LearningActivity(
        user_id=current_user.id,
        activity_type="upload",
        title=f"Uploaded {display_title} ({mat_type.upper()})",
        details=json.dumps({"filename": original_filename, "size": file_size})
    ))

    db.commit()
    db.refresh(material)

    # Process ingestion in background
    def run_ingestion_task(mat_id: str):
        from app.core.database import SessionLocal
        bg_db = SessionLocal()
        try:
            m = bg_db.query(Material).filter(Material.id == mat_id).first()
            if m:
                ingestion_pipeline.process_material(bg_db, m)
        finally:
            bg_db.close()

    background_tasks.add_task(run_ingestion_task, material.id)

    # Build response
    resp = MaterialResponse(
        id=material.id,
        title=material.title,
        original_filename=material.original_filename,
        file_type=material.file_type,
        file_size=material.file_size,
        status=material.status,
        error_message=material.error_message,
        summary=material.summary,
        detected_topics=json.loads(material.detected_topics or "[]"),
        total_pages_or_slides=material.total_pages_or_slides,
        created_at=material.created_at,
        chunk_count=0
    )
    return resp

@router.get("/", response_model=List[MaterialResponse])
def list_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    materials = (
        db.query(Material)
        .filter(Material.user_id == current_user.id)
        .order_by(Material.created_at.desc())
        .all()
    )

    results = []
    for m in materials:
        chunk_count = db.query(ExtractedChunk).filter(ExtractedChunk.material_id == m.id).count()
        results.append(MaterialResponse(
            id=m.id,
            title=m.title,
            original_filename=m.original_filename,
            file_type=m.file_type,
            file_size=m.file_size,
            status=m.status,
            error_message=m.error_message,
            summary=m.summary,
            detected_topics=json.loads(m.detected_topics or "[]"),
            total_pages_or_slides=m.total_pages_or_slides,
            created_at=m.created_at,
            chunk_count=chunk_count
        ))
    return results

@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    m = db.query(Material).filter(Material.id == material_id, Material.user_id == current_user.id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found.")

    chunk_count = db.query(ExtractedChunk).filter(ExtractedChunk.material_id == m.id).count()
    return MaterialResponse(
        id=m.id,
        title=m.title,
        original_filename=m.original_filename,
        file_type=m.file_type,
        file_size=m.file_size,
        status=m.status,
        error_message=m.error_message,
        summary=m.summary,
        detected_topics=json.loads(m.detected_topics or "[]"),
        total_pages_or_slides=m.total_pages_or_slides,
        created_at=m.created_at,
        chunk_count=chunk_count
    )

@router.get("/{material_id}/chunks", response_model=List[ExtractedChunkResponse])
def get_material_chunks(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    m = db.query(Material).filter(Material.id == material_id, Material.user_id == current_user.id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found.")

    chunks = db.query(ExtractedChunk).filter(ExtractedChunk.material_id == material_id).order_by(ExtractedChunk.chunk_index.asc()).all()
    results = []
    for c in chunks:
        results.append(ExtractedChunkResponse(
            id=c.id,
            material_id=c.material_id,
            chunk_index=c.chunk_index,
            content=c.content,
            source_type=c.source_type,
            page_number=c.page_number,
            slide_number=c.slide_number,
            video_timestamp=c.video_timestamp,
            topic_tags=json.loads(c.topic_tags or "[]"),
            figure_description=c.figure_description
        ))
    return results

@router.delete("/{material_id}")
def delete_material(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    m = db.query(Material).filter(Material.id == material_id, Material.user_id == current_user.id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found.")

    if os.path.exists(m.file_path):
        try:
            os.remove(m.file_path)
        except Exception:
            pass

    db.delete(m)
    db.commit()
    return {"message": "Material successfully deleted."}
