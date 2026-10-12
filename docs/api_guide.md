# EduAdapt AI — REST API Documentation

Base URL: `http://localhost:8000/api/v1`
Interactive Swagger UI: `http://localhost:8000/api/v1/docs`

## 1. Authentication

### `POST /auth/register`
Creates a student account.
```json
{
  "email": "student@university.edu",
  "password": "secure_password",
  "full_name": "Alex Rivera"
}
```

### `POST /auth/login`
Returns JWT access token.
```json
{
  "email": "student@eduadapt.ai",
  "password": "password123"
}
```

### `GET /auth/me`
Returns current authenticated user profile. Requires `Authorization: Bearer <token>`.

---

## 2. Materials & Ingestion

### `POST /materials/upload`
Multipart form upload supporting PDF, PPTX, Video/subtitles (`.srt`, `.vtt`, `.mp4`), and plain text.
- Form fields: `file`, `title` (optional)
- Asynchronously processes text chunks, extracts figures, detects concepts, and generates embeddings.

### `GET /materials/`
Lists all uploaded course materials for the current user.

### `GET /materials/{id}/chunks`
Returns extracted chunks with `page_number`, `slide_number`, `video_timestamp`, and `topic_tags`.

### `DELETE /materials/{id}`
Deletes material and removes indexed chunk embeddings.

---

## 3. AI Tutor & RAG

### `POST /tutor/chat`
Ask question with strict evidence grounding and citation validation.
```json
{
  "content": "How does the Hessian condition number affect optimization?",
  "material_id": null,
  "allow_external_knowledge": false
}
```
Response:
```json
{
  "content": "Based on your course materials in Deep Learning Foundations (Page 5) [Source 1]...",
  "refusal_flag": false,
  "citations": [
    {
      "chunk_id": "...",
      "material_title": "Deep Learning Foundations",
      "source_type": "pdf",
      "page_number": 5,
      "snippet": "The second-order curvature of the loss surface..."
    }
  ]
}
```

---

## 4. Adaptive Assessments & BKT

### `POST /assessments/generate`
Generates assessment targeting weak concepts:
```json
{
  "topic_name": "Gradient Descent Optimization",
  "difficulty": "Adaptive",
  "question_count": 5,
  "time_limit_minutes": 15
}
```

### `POST /assessments/{id}/submit`
Grades student responses, detects misconceptions, and updates BKT topic mastery probabilities.

---

## 5. Analytics & Knowledge Map

### `GET /analytics/dashboard`
Returns total study time, materials count, overall mastery index, weak topics, and active AI engine status.

### `GET /analytics/knowledge-map`
Returns topic nodes, mastery levels, and prerequisite directed edges.

---

## 6. Benchmarking & Evaluation

### `POST /evaluation/run`
Triggers RAGAS-compatible evaluation measuring Faithfulness, Precision, Recall, Citation Accuracy, Refusal Rate, and 8-round synthetic learner simulations.
