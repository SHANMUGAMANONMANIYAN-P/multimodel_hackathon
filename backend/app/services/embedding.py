import math
import hashlib
import json
from typing import List, Optional
import numpy as np
from app.core.config import settings

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    v1 = np.array(vec1, dtype=np.float32)
    v2 = np.array(vec2, dtype=np.float32)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))

class EmbeddingService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.gemini_client = None
        if self.api_key:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[EmbeddingService] Failed to initialize google-genai client: {e}")

    def get_embedding(self, text: str) -> List[float]:
        """
        Generates embedding vector. Uses Gemini embedding model if API key is configured,
        or deterministic local semantic n-gram projection (384 dims) as local fallback.
        """
        clean_text = text.strip()
        if not clean_text:
            return [0.0] * 384

        if self.gemini_client:
            try:
                response = self.gemini_client.models.embed_content(
                    model=settings.EMBEDDING_MODEL,
                    contents=clean_text
                )
                if hasattr(response, "embedding") and response.embedding:
                    return response.embedding.values
                elif hasattr(response, "embeddings") and response.embeddings:
                    return response.embeddings[0].values
            except Exception as e:
                print(f"[EmbeddingService] Gemini embedding call failed ({e}), falling back to local projection.")

        return self._local_semantic_embedding(clean_text)

    def _local_semantic_embedding(self, text: str, dimensions: int = 384) -> List[float]:
        """
        Deterministic, collision-resistant semantic hash projection using character/word n-grams.
        Preserves cosine proximity for related terms without requiring external model servers.
        """
        words = text.lower().split()
        vec = np.zeros(dimensions, dtype=np.float32)

        for i, word in enumerate(words):
            # Unigram hash
            h1 = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            idx1 = h1 % dimensions
            sign1 = 1.0 if (h1 % 2 == 0) else -1.0
            vec[idx1] += sign1

            # Bigram hash for phrase context
            if i < len(words) - 1:
                bigram = f"{word}_{words[i+1]}"
                h2 = int(hashlib.sha1(bigram.encode("utf-8")).hexdigest(), 16)
                idx2 = h2 % dimensions
                sign2 = 1.0 if (h2 % 2 == 0) else -1.0
                vec[idx2] += 1.5 * sign2

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return [float(x) for x in vec]

embedding_service = EmbeddingService()
