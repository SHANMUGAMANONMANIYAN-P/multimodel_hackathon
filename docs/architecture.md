# EduAdapt AI — System Architecture & Design

**EduAdapt AI** is a multimodal adaptive learning system designed for the Multimodal AI Hackathon 2026 (Track D: Personalized Tutoring & Adaptive Learning).

## 1. High-Level Architecture

```
[Student Interface (React 19 + Vite + TypeScript + Tailwind)]
                      │
                      ▼ REST API / JSON
[FastAPI Application Backend (Python 3.12)]
  ├── /auth          → JWT Authentication & User Isolation
  ├── /materials     → Multimodal Ingestion Pipeline (PyMuPDF, python-pptx, SRT/VTT)
  ├── /tutor         → Grounded RAG Engine with Citation Verification & Strict Refusal
  ├── /assessments   → Adaptive Quiz Generation with Fingerprint Deduplication
  ├── /analytics     → Bayesian Knowledge Tracing (BKT) Engine & Prerequisite DAG
  └── /evaluation    → Benchmarking Module (Faithfulness, Relevancy, Precision, Refusal)
                      │
                      ▼
[Dual Persistence & Retrieval Layer]
  ├── Relational: SQLite (dev) / PostgreSQL (prod)
  └── Vectors: Cosine Projection (dev) / pgvector (prod)
```

## 2. Core Components

### A. Multimodal Ingestion Pipeline
- **PDF Extraction**: Uses PyMuPDF (`fitz`) to extract page-by-page text, detect image bounding boxes, and capture figure descriptions.
- **PowerPoint Extraction**: Uses `python-pptx` to parse slide-by-slide structures, shape text, and presenter speaker notes.
- **Video & Transcripts**: Parses timestamped subtitles (`.srt`, `.vtt`) and time-coded lecture segments (`[MM:SS]`), preserving exact playback markers.
- **Metadata Preservation**: Every chunk retains:
  - `material_id`
  - `source_type` (pdf, pptx, video, text)
  - `page_number`, `slide_number`, or `video_timestamp`
  - `topic_tags` and `figure_description`
  - `embedding` vector

### B. Hallucination-Resistant Grounded RAG Tutor
- Uses hybrid retrieval: Cosine semantic similarity + BM25 content token overlap.
- **Strict Refusal Logic**: If the retrieved chunks lack genuine token overlap or confidence falls below threshold, the tutor refuses with:
  > *"I couldn't verify this answer from your uploaded course materials."*
- **Clickable Source Citations**: Answers link directly to the underlying chunk metadata. Clicking a citation triggers the `SourceViewerModal` which displays the exact page, slide, or video timestamp.

### C. Bayesian Knowledge Tracing (BKT)
- Corbett & Anderson (1995) formulation:
  - $P(L_0)$: Initial probability of knowing
  - $P(T)$: Transit probability (learning rate)
  - $P(G)$: Guess probability
  - $P(S)$: Slip probability
- Dynamic adjustment of Guess and Slip parameters based on question difficulty (Easy, Medium, Hard).
- Posterior update after every practice observation.
