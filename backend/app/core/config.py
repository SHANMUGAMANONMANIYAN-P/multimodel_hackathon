import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduAdapt AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "eduadapt-multimodal-ai-2026-secret-key-token-auth"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./eduadapt.db"
    
    # AI Credentials & Models
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gemini-3.8-flash"
    EMBEDDING_MODEL: str = "gemini-embedding-001"
    
    # Uploads & Storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".pptx", ".txt", ".md", ".mp4", ".srt", ".vtt"]
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Bayesian Knowledge Tracing (BKT) Defaults
    BKT_DEFAULT_L0: float = 0.20  # Initial probability of knowing
    BKT_DEFAULT_T: float = 0.15   # Probability of learning / transit
    BKT_DEFAULT_G: float = 0.25   # Probability of guessing correctly
    BKT_DEFAULT_S: float = 0.10   # Probability of slipping (knowing but making a mistake)

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
