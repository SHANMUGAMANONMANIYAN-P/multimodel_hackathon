from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    sub: Optional[str] = None

# Material Schemas
class ExtractedChunkResponse(BaseModel):
    id: str
    material_id: str
    chunk_index: int
    content: str
    source_type: str
    page_number: Optional[int] = None
    slide_number: Optional[int] = None
    video_timestamp: Optional[str] = None
    topic_tags: List[str] = []
    figure_description: Optional[str] = None

    class Config:
        from_attributes = True

class MaterialResponse(BaseModel):
    id: str
    title: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    error_message: Optional[str] = None
    summary: Optional[str] = None
    detected_topics: List[str] = []
    total_pages_or_slides: int
    created_at: datetime
    chunk_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Topic & Mastery Schemas
class TopicResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: str

    class Config:
        from_attributes = True

class TopicPrerequisiteResponse(BaseModel):
    topic_id: str
    topic_name: str
    prerequisite_id: str
    prerequisite_name: str
    strength: float

class TopicMasteryResponse(BaseModel):
    id: str
    topic_name: str
    current_mastery: float
    mastery_state: str # NOVICE, DEVELOPING, PROFICIENT, MASTERED
    total_practices: int
    correct_practices: int
    last_practiced_at: datetime

    class Config:
        from_attributes = True

# Chat Schemas
class CitationItem(BaseModel):
    chunk_id: str
    material_id: str
    material_title: str
    source_type: str # pdf, pptx, text, video
    page_number: Optional[int] = None
    slide_number: Optional[int] = None
    video_timestamp: Optional[str] = None
    snippet: str

class ChatMessageCreate(BaseModel):
    content: str
    material_id: Optional[str] = None
    allow_external_knowledge: bool = False

class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender: str
    content: str
    refusal_flag: bool
    citations: List[CitationItem] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ChatConversationResponse(BaseModel):
    id: str
    title: str
    material_id: Optional[str] = None
    topic_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

# Assessment Schemas
class AssessmentGenerateRequest(BaseModel):
    material_id: Optional[str] = None
    topic_name: Optional[str] = None
    difficulty: str = "Medium" # Easy, Medium, Hard, Adaptive
    question_count: int = 5
    time_limit_minutes: int = 15

class QuestionResponse(BaseModel):
    id: str
    question_text: str
    question_type: str # mcq, short_answer, numerical
    topic_name: str
    difficulty: str
    options: List[str] = []
    fingerprint: str
    source_references: List[CitationItem] = []

    class Config:
        from_attributes = True

class AssessmentResponse(BaseModel):
    id: str
    title: str
    difficulty: str
    question_count: int
    time_limit_minutes: int
    status: str
    created_at: datetime
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True

class StudentAnswerSubmit(BaseModel):
    question_id: str
    student_response: str

class AssessmentSubmitRequest(BaseModel):
    time_spent_seconds: int = 0
    answers: List[StudentAnswerSubmit]

class StudentAnswerReviewResponse(BaseModel):
    question_id: str
    question_text: str
    question_type: str
    student_response: str
    answer_key: str
    is_correct: bool
    points_awarded: float
    feedback: str
    misconception: Optional[str] = None
    explanation: str
    source_references: List[CitationItem] = []

class TopicMasteryDelta(BaseModel):
    topic_name: str
    prior_mastery: float
    updated_mastery: float
    delta: float
    mastery_state: str
    explanation: str

class AssessmentResultResponse(BaseModel):
    attempt_id: str
    assessment_id: str
    score: float
    max_score: float
    percentage: float
    time_spent_seconds: int
    inferred_misconceptions: List[str] = []
    answers: List[StudentAnswerReviewResponse] = []
    mastery_updates: List[TopicMasteryDelta] = []
    recommended_revision_topics: List[str] = []
    suggested_next_activity: str

# Analytics & Dashboard Schemas
class DashboardStatsResponse(BaseModel):
    total_materials: int
    quizzes_completed: int
    overall_mastery: float
    study_time_minutes: int
    topic_masteries: List[TopicMasteryResponse] = []
    weak_topics: List[TopicMasteryResponse] = []
    strong_topics: List[TopicMasteryResponse] = []
    recent_activities: List[Dict[str, Any]] = []
    recommended_next_activity: str
    ai_status: Dict[str, Any]

# Evaluation Schemas
class EvaluationRunRequest(BaseModel):
    dataset_name: Optional[str] = "Standard Multimodal Test Set"
    simulate_learners: bool = True

class EvaluationRunResponse(BaseModel):
    id: str
    run_name: str
    model_used: str
    status: str
    metrics: Dict[str, float]
    learner_simulations: Dict[str, Any]
    created_at: datetime
