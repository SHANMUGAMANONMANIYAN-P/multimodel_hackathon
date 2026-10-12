# EduAdapt AI — Multimodal Adaptive Learning System

[![Hackathon 2026](https://img.shields.io/badge/Hackathon-Multimodal%20AI%202026-6366f1.svg)](https://github.com)
[![Track](https://img.shields.io/badge/Track%20D-Adaptive%20Learning%20%26%20Tutoring-8b5cf6.svg)](https://github.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178c6.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38bdf8.svg)](https://tailwindcss.com)

**EduAdapt AI** is an end-to-end multimodal adaptive learning platform that unifies lecture videos, textbooks, PDFs, and slide decks into a source-grounded knowledge base, generates adaptive assessments, tracks student mastery with Corbett & Anderson Bayesian Knowledge Tracing (BKT), and delivers verifiable, hallucination-resistant tutoring.

---

## Key Features

1. **Multimodal Ingestion Pipeline**:
   - **PDFs**: Page-by-page text, section headers, and technical figure descriptions via PyMuPDF (`fitz`).
   - **PowerPoint**: Slide titles, shapes, and presenter notes via `python-pptx`.
   - **Lecture Videos & Subtitles**: Time-coded transcript extraction (`.srt`, `.vtt`, `.txt`, `.mp4`) preserving exact timestamps (`[02:15 - 04:30]`).
2. **Hallucination-Resistant Grounded AI Tutor**:
   - Strictly answers using retrieved course chunks with clickable citations (`[Page 4]`, `[Slide 6]`, `[Video 02:15]`).
   - Clicking any citation opens the **Source Viewer Modal** displaying the exact underlying page/slide/timestamp.
   - Refuses queries that lack evidence in uploaded materials (`"I couldn't verify this answer from your uploaded course materials."`).
3. **Bayesian Knowledge Tracing (BKT) Learner Model**:
   - Real mathematical implementation of Corbett & Anderson (1995) formulation:
     $$P(L_t \mid obs=1) = \frac{P(L_t) \cdot (1 - P(S))}{P(L_t)(1 - P(S)) + (1 - P(L_t))P(G)}$$
     $$P(L_{t+1}) = P(L_t \mid obs) + (1 - P(L_t \mid obs)) \cdot P(T)$$
   - Dynamically modulates Guess and Slip probabilities by question difficulty.
   - Categorizes mastery states: `NOVICE` (<40%), `DEVELOPING` (40-70%), `PROFICIENT` (70-85%), `MASTERED` (≥85%).
4. **Adaptive Assessment Generator**:
   - Targets weak concepts identified by BKT.
   - Generates MCQ, short-answer, and numerical problems.
   - SHA-256 fingerprint deduplication prevents repeating questions previously encountered by the student.
   - Evidence-based answer keys and misconception detection.
5. **Interactive Concept & Prerequisite Map**:
   - Visual DAG of course concepts and prerequisite linkages with real-time color-coded mastery.
6. **Reproducible Evaluation & Benchmark Suite**:
   - RAGAS-compatible metrics: Faithfulness, Relevancy, Context Precision/Recall, Citation Accuracy, Refusal Rate.
   - 8-round synthetic learner convergence simulation (Beginner, Intermediate, Advanced).

---

## Project Structure

```
eduadapt-ai/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # Auth, Materials, Tutor, Assessments, Analytics, Evaluation
│   │   ├── core/              # Config, Security, Database, BKT Engine
│   │   ├── models/            # SQLAlchemy Database Models
│   │   ├── schemas/           # Pydantic Schemas
│   │   ├── services/          # Ingestion (PDF, PPTX, Video), RAG Tutor, Question Gen, Evaluation
│   │   ├── main.py            # FastAPI Entry Point
│   │   └── seed_data.py       # Pre-seeded Course Materials & Demo Data
│   ├── tests/                 # Pytest Test Suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, SourceViewerModal, ChunkViewerModal
│   │   ├── pages/             # Landing, Login, Register, Dashboard, Materials, Tutor, Assessment, Results, KnowledgeMap, Evaluation
│   │   ├── context/           # AuthContext
│   │   ├── services/          # API Client
│   │   └── types/             # TypeScript Interfaces
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── Dockerfile
├── docs/                      # Architecture, BKT Formulation, API Guide, 12-Step Demo Script
├── evaluation/                # Test Benchmark Dataset & CLI Evaluation Runner
├── docker-compose.yml
├── .env.example
├── README.md
└── .gitignore
```

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.12+
- Node.js 20+ & npm

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend (starts SQLite automatically and seeds demo materials)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/api/v1/docs`

### 2. Frontend Setup

In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Demo Credentials & Fast-Track Evaluation

- **Demo Student Account**: `student@eduadapt.ai`
- **Password**: `password123`
- Alternatively, click the **"One-Click Demo Login (Alex Rivera)"** button on the login screen.

---

## Running Automated Tests

```bash
cd backend
.\.venv\Scripts\python -m pytest -v
```
All 10 test suites cover BKT posterior updates, RAG refusal thresholds, citation extraction, assessment generation, and evaluation triggers.

---

## Running the Evaluation Benchmark

### Via Web Interface:
Navigate to the **"Benchmark & Evaluation"** page and click **"Run Live Benchmark"**.

### Via CLI:
```bash
.\backend\.venv\Scripts\python evaluation\run_evaluation.py
```

---

## Docker Deployment (Optional)

```bash
docker-compose up --build
```
This boots:
- PostgreSQL 16 with pgvector on port `5432`
- FastAPI backend on port `8000`
- React/Nginx frontend on port `5173`

---

## Architectural Transparency: Real vs. Local Modes

- **Dual AI Mode**: When `GEMINI_API_KEY` is provided, calls Google Gemini (`gemini-3.8-flash`). When omitted, EduAdapt AI switches to **Local Extractive RAG Mode** with deterministic semantic projection vectors and BM25 token filtering. Both modes enforce strict refusal on unsupported questions and cite genuine chunk metadata.
- **Learner Model**: Bayesian Knowledge Tracing is 100% computed mathematically in Python and persisted per user/topic.
- **Evaluation**: The benchmark runner executes genuine test set queries and reports calculated metrics without mock data.
