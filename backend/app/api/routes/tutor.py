import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User, ChatConversation, ChatMessage, LearningActivity, Material
from app.schemas.schemas import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatConversationResponse,
    CitationItem
)
from app.api.deps import get_current_user
from app.services.rag_tutor import rag_tutor_service

router = APIRouter()

@router.post("/chat", response_model=ChatMessageResponse)
def ask_tutor(
    chat_in: ChatMessageCreate,
    conversation_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve or create conversation
    conv = None
    if conversation_id:
        conv = db.query(ChatConversation).filter(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == current_user.id
        ).first()

    if not conv:
        first_few_words = " ".join(chat_in.content.split()[:5])
        conv = ChatConversation(
            user_id=current_user.id,
            material_id=chat_in.material_id,
            title=f"Study: {first_few_words}..."
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Store student message
    student_msg = ChatMessage(
        conversation_id=conv.id,
        sender="user",
        content=chat_in.content
    )
    db.add(student_msg)
    db.commit()

    # Generate tutor response via grounded RAG pipeline
    result = rag_tutor_service.generate_tutoring_response(
        db=db,
        query=chat_in.content,
        material_id=chat_in.material_id,
        allow_external_knowledge=chat_in.allow_external_knowledge
    )

    tutor_msg = ChatMessage(
        conversation_id=conv.id,
        sender="assistant",
        content=result["content"],
        refusal_flag=result["refusal_flag"],
        citations=json.dumps(result["citations"])
    )
    db.add(tutor_msg)

    # Log activity
    db.add(LearningActivity(
        user_id=current_user.id,
        activity_type="chat",
        title=f"Asked AI Tutor: {chat_in.content[:40]}...",
        details=json.dumps({"citations_count": len(result["citations"]), "refused": result["refusal_flag"]})
    ))

    db.commit()
    db.refresh(tutor_msg)

    parsed_citations = [CitationItem(**c) for c in result["citations"]]
    return ChatMessageResponse(
        id=tutor_msg.id,
        conversation_id=conv.id,
        sender=tutor_msg.sender,
        content=tutor_msg.content,
        refusal_flag=tutor_msg.refusal_flag,
        citations=parsed_citations,
        created_at=tutor_msg.created_at
    )

@router.get("/conversations", response_model=List[ChatConversationResponse])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    convs = (
        db.query(ChatConversation)
        .filter(ChatConversation.user_id == current_user.id)
        .order_by(ChatConversation.updated_at.desc())
        .limit(20)
        .all()
    )

    results = []
    for c in convs:
        msgs = db.query(ChatMessage).filter(ChatMessage.conversation_id == c.id).order_by(ChatMessage.created_at.asc()).all()
        msg_responses = []
        for m in msgs:
            raw_citations = json.loads(m.citations or "[]")
            citations = [CitationItem(**cit) for cit in raw_citations]
            msg_responses.append(ChatMessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                sender=m.sender,
                content=m.content,
                refusal_flag=m.refusal_flag,
                citations=citations,
                created_at=m.created_at
            ))

        results.append(ChatConversationResponse(
            id=c.id,
            title=c.title,
            material_id=c.material_id,
            topic_id=c.topic_id,
            created_at=c.created_at,
            updated_at=c.updated_at,
            messages=msg_responses
        ))
    return results

@router.get("/conversations/{conversation_id}", response_model=ChatConversationResponse)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.user_id == current_user.id
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    msgs = db.query(ChatMessage).filter(ChatMessage.conversation_id == c.id).order_by(ChatMessage.created_at.asc()).all()
    msg_responses = []
    for m in msgs:
        raw_citations = json.loads(m.citations or "[]")
        citations = [CitationItem(**cit) for cit in raw_citations]
        msg_responses.append(ChatMessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            sender=m.sender,
            content=m.content,
            refusal_flag=m.refusal_flag,
            citations=citations,
            created_at=m.created_at
        ))

    return ChatConversationResponse(
        id=c.id,
        title=c.title,
        material_id=c.material_id,
        topic_id=c.topic_id,
        created_at=c.created_at,
        updated_at=c.updated_at,
        messages=msg_responses
    )
