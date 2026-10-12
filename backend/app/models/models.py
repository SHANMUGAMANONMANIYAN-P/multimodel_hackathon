import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="student")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)

    materials = relationship("Material", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("ChatConversation", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    mastery_records = relationship("TopicMastery", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("LearningActivity", back_populates="user", cascade="all, delete-orphan")

class Material(Base):
    __tablename__ = "materials"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, pptx, text, video
    file_size = Column(Integer, default=0)
    status = Column(String, default="pending")   # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    detected_topics = Column(Text, default="[]") # JSON list of strings
    total_pages_or_slides = Column(Integer, default=0)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="materials")
    chunks = relationship("ExtractedChunk", back_populates="material", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, default="General")
    created_at = Column(DateTime, default=get_utc_now)

class TopicPrerequisite(Base):
    __tablename__ = "topic_prerequisites"

    id = Column(String, primary_key=True, default=generate_uuid)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=False)
    prerequisite_id = Column(String, ForeignKey("topics.id"), nullable=False)
    strength = Column(Float, default=1.0) # correlation or required readiness
    created_at = Column(DateTime, default=get_utc_now)

class ExtractedChunk(Base):
    __tablename__ = "extracted_chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    material_id = Column(String, ForeignKey("materials.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    source_type = Column(String, nullable=False)  # pdf, pptx, text, video
    page_number = Column(Integer, nullable=True)
    slide_number = Column(Integer, nullable=True)
    video_timestamp = Column(String, nullable=True) # e.g. "04:12" or "02:15 - 03:40"
    token_count = Column(Integer, default=0)
    topic_tags = Column(Text, default="[]")         # JSON list
    figure_description = Column(Text, nullable=True)
    embedding = Column(Text, nullable=True)         # JSON list of floats for vector search
    created_at = Column(DateTime, default=get_utc_now)

    material = relationship("Material", back_populates="chunks")

class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    material_id = Column(String, ForeignKey("materials.id"), nullable=True)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=True)
    title = Column(String, default="Study Discussion")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("chat_conversations.id"), nullable=False, index=True)
    sender = Column(String, nullable=False) # user, assistant
    content = Column(Text, nullable=False)
    refusal_flag = Column(Boolean, default=False)
    citations = Column(Text, default="[]") # JSON list of CitationRecord objects
    created_at = Column(DateTime, default=get_utc_now)

    conversation = relationship("ChatConversation", back_populates="messages")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    material_id = Column(String, ForeignKey("materials.id"), nullable=True)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=True)
    title = Column(String, nullable=False)
    difficulty = Column(String, default="Medium") # Easy, Medium, Hard, Adaptive
    question_count = Column(Integer, default=5)
    time_limit_minutes = Column(Integer, default=15)
    status = Column(String, default="ready") # ready, active, completed
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="assessments")
    questions = relationship("Question", back_populates="assessment", cascade="all, delete-orphan")
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default="mcq") # mcq, short_answer, numerical
    topic_name = Column(String, nullable=False)
    subtopic_name = Column(String, nullable=True)
    difficulty = Column(String, default="Medium")
    options = Column(Text, default="[]")          # JSON list of options for MCQ
    answer_key = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    fingerprint = Column(String, index=True, nullable=False)
    source_references = Column(Text, default="[]") # JSON list of {chunk_id, source_type, page/slide/timestamp, text_snippet}
    created_at = Column(DateTime, default=get_utc_now)

    assessment = relationship("Assessment", back_populates="questions")

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(String, primary_key=True, default=generate_uuid)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    score = Column(Float, default=0.0)
    max_score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    time_spent_seconds = Column(Integer, default=0)
    inferred_misconceptions = Column(Text, default="[]") # JSON list
    completed_at = Column(DateTime, default=get_utc_now)

    assessment = relationship("Assessment", back_populates="attempts")
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")

class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id = Column(String, primary_key=True, default=generate_uuid)
    attempt_id = Column(String, ForeignKey("assessment_attempts.id"), nullable=False, index=True)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    student_response = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    points_awarded = Column(Float, default=0.0)
    feedback = Column(Text, nullable=True)
    misconception = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    attempt = relationship("AssessmentAttempt", back_populates="answers")

class TopicMastery(Base):
    __tablename__ = "topic_mastery"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=True)
    topic_name = Column(String, nullable=False, index=True)
    p_l0 = Column(Float, default=0.20)
    p_t = Column(Float, default=0.15)
    p_g = Column(Float, default=0.25)
    p_s = Column(Float, default=0.10)
    current_mastery = Column(Float, default=0.20)
    mastery_state = Column(String, default="NOVICE") # NOVICE, DEVELOPING, PROFICIENT, MASTERED
    total_practices = Column(Integer, default=0)
    correct_practices = Column(Integer, default=0)
    last_practiced_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="mastery_records")

class TopicMasteryHistory(Base):
    __tablename__ = "topic_mastery_history"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    topic_name = Column(String, nullable=False)
    attempt_id = Column(String, nullable=True)
    prior_mastery = Column(Float, nullable=False)
    updated_mastery = Column(Float, nullable=False)
    delta = Column(Float, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

class LearningActivity(Base):
    __tablename__ = "learning_activities"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    activity_type = Column(String, nullable=False) # upload, chat, assessment, review
    title = Column(String, nullable=False)
    details = Column(Text, default="{}") # JSON metadata
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="activities")

class EvaluationDataset(Base):
    __tablename__ = "evaluation_datasets"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    sample_count = Column(Integer, default=0)
    dataset_type = Column(String, default="standard") # standard, edge_cases, multimodal
    created_at = Column(DateTime, default=get_utc_now)

class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    dataset_id = Column(String, ForeignKey("evaluation_datasets.id"), nullable=True)
    run_name = Column(String, nullable=False)
    model_used = Column(String, default="gemini-3.8-flash")
    status = Column(String, default="completed") # pending, running, completed, failed
    metrics = Column(Text, default="{}") # JSON dictionary of RAGAS-compatible metrics
    learner_simulations = Column(Text, default="{}") # JSON simulation data for Beginner, Intermediate, Advanced
    created_at = Column(DateTime, default=get_utc_now)
