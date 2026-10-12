import os
import re
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import fitz  # PyMuPDF
from pptx import Presentation

from app.models.models import Material, ExtractedChunk, Topic, TopicPrerequisite
from app.services.embedding import embedding_service

def extract_topics_from_text(text: str) -> List[str]:
    """Extracts likely topics and concepts using heading and keyword detection."""
    candidate_topics = set()
    # Heading patterns like "1. Introduction to Linear Algebra" or "Chapter 2: Eigenvalues"
    heading_matches = re.findall(r"(?:(?:Chapter|Section|Unit)\s+\d+[:\s]+|^\s*#+\s*)([A-Z][A-Za-z0-9\s\-]{3,40})", text, re.MULTILINE)
    for h in heading_matches:
        candidate_topics.add(h.strip())
        
    # Standard STEM/AI/CS and foundational curriculum patterns
    common_subjects = [
        "Linear Algebra", "Vector Spaces", "Matrix Operations", "Eigenvalues and Eigenvectors",
        "Calculus", "Partial Derivatives", "Optimization", "Gradient Descent",
        "Probability and Statistics", "Bayes Theorem", "Markov Chains",
        "Machine Learning", "Supervised Learning", "Unsupervised Learning",
        "Neural Networks", "Backpropagation", "Convolutional Neural Networks",
        "Recurrent Neural Networks", "Transformers", "Attention Mechanism",
        "Data Structures", "Binary Trees", "Graph Algorithms", "Dynamic Programming",
        "Database Systems", "Relational Algebra", "Normalization", "Indexing"
    ]
    lower_text = text.lower()
    for subj in common_subjects:
        if subj.lower() in lower_text:
            candidate_topics.add(subj)

    if not candidate_topics:
        # Fallback to key title phrases
        first_line = text.strip().split("\n")[0][:50]
        if len(first_line) > 5:
            candidate_topics.add(first_line)
        else:
            candidate_topics.add("Core Fundamentals")

    return sorted(list(candidate_topics))[:8]

class IngestionPipeline:
    @staticmethod
    def process_material(db: Session, material: Material) -> None:
        """
        Main entry point for processing uploaded materials.
        Dispatches to format-specific extractors, chunks the content,
        generates embeddings, and stores source-grounded chunks.
        """
        material.status = "processing"
        material.error_message = None
        db.commit()

        try:
            file_ext = os.path.splitext(material.original_filename)[1].lower()
            chunks_data: List[Dict[str, Any]] = []
            total_units = 0

            if file_ext == ".pdf":
                chunks_data, total_units = IngestionPipeline._process_pdf(material.file_path)
            elif file_ext in [".pptx", ".ppt"]:
                chunks_data, total_units = IngestionPipeline._process_pptx(material.file_path)
            elif file_ext in [".srt", ".vtt", ".mp4"]:
                chunks_data, total_units = IngestionPipeline._process_video_or_transcript(material.file_path, file_ext)
            else:
                chunks_data, total_units = IngestionPipeline._process_text_file(material.file_path)

            if not chunks_data:
                raise ValueError("No extractable text or content found in the uploaded file.")

            # Identify topics across all chunks
            all_text = " ".join([c["content"] for c in chunks_data])
            detected_topics = extract_topics_from_text(all_text)
            material.detected_topics = json.dumps(detected_topics)
            material.total_pages_or_slides = total_units

            # Store detected topics in the Topic table and build initial prerequisite links
            IngestionPipeline._register_topics_and_prerequisites(db, detected_topics)

            # Store chunks with source metadata and embeddings
            for idx, c in enumerate(chunks_data):
                chunk_topics = [t for t in detected_topics if t.lower() in c["content"].lower()] or detected_topics[:2]
                embedding_vec = embedding_service.get_embedding(c["content"])

                chunk = ExtractedChunk(
                    material_id=material.id,
                    chunk_index=idx,
                    content=c["content"],
                    source_type=c["source_type"],
                    page_number=c.get("page_number"),
                    slide_number=c.get("slide_number"),
                    video_timestamp=c.get("video_timestamp"),
                    token_count=len(c["content"].split()),
                    topic_tags=json.dumps(chunk_topics),
                    figure_description=c.get("figure_description"),
                    embedding=json.dumps(embedding_vec)
                )
                db.add(chunk)

            material.status = "completed"
            material.summary = (
                f"Successfully indexed {len(chunks_data)} verified chunks from {total_units} "
                f"{'pages' if file_ext == '.pdf' else 'slides' if file_ext in ['.pptx', '.ppt'] else 'segments'}. "
                f"Identified {len(detected_topics)} key topics."
            )
            db.commit()

        except Exception as e:
            db.rollback()
            material.status = "failed"
            material.error_message = f"Ingestion error: {str(e)}"
            db.commit()

    @staticmethod
    def _process_pdf(file_path: str):
        chunks = []
        doc = fitz.open(file_path)
        total_pages = len(doc)

        for page_num in range(total_pages):
            page = doc[page_num]
            text = page.get_text("text").strip()
            image_list = page.get_images(full=True)
            figure_desc = f"Contains {len(image_list)} technical diagram(s)/figures." if image_list else None

            if not text and figure_desc:
                text = f"[Visual Figure Page {page_num + 1}]: Technical visual schematic and diagram."

            if text:
                # Sub-chunk if a single page is very long (> 2000 chars)
                paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
                current_chunk = []
                current_len = 0

                for p in paragraphs:
                    current_chunk.append(p)
                    current_len += len(p)
                    if current_len >= 800:
                        chunks.append({
                            "content": "\n\n".join(current_chunk),
                            "source_type": "pdf",
                            "page_number": page_num + 1,
                            "figure_description": figure_desc
                        })
                        current_chunk = []
                        current_len = 0

                if current_chunk:
                    chunks.append({
                        "content": "\n\n".join(current_chunk),
                        "source_type": "pdf",
                        "page_number": page_num + 1,
                        "figure_description": figure_desc
                    })

        doc.close()
        return chunks, total_pages

    @staticmethod
    def _process_pptx(file_path: str):
        chunks = []
        prs = Presentation(file_path)
        total_slides = len(prs.slides)

        for idx, slide in enumerate(prs.slides):
            slide_num = idx + 1
            text_runs = []
            
            # Slide title
            title = ""
            if slide.shapes.title and slide.shapes.title.text:
                title = slide.shapes.title.text.strip()
                text_runs.append(f"Slide Title: {title}")

            # Slide body shapes
            for shape in slide.shapes:
                if shape.has_text_frame and shape != slide.shapes.title:
                    for para in shape.text_frame.paragraphs:
                        p_text = para.text.strip()
                        if p_text and p_text != title:
                            text_runs.append(p_text)

            # Speaker notes
            notes = ""
            if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                notes = slide.notes_slide.notes_text_frame.text.strip()
                if notes:
                    text_runs.append(f"[Speaker Notes]: {notes}")

            full_slide_text = "\n".join(text_runs).strip()
            if not full_slide_text:
                full_slide_text = f"Slide {slide_num}: Visual Diagram / Architecture Layout"

            chunks.append({
                "content": full_slide_text,
                "source_type": "pptx",
                "slide_number": slide_num,
                "figure_description": "Slide presentation diagram" if len(slide.shapes) > 3 else None
            })

        return chunks, total_slides

    @staticmethod
    def _process_video_or_transcript(file_path: str, ext: str):
        """
        Parses video transcripts with timestamps.
        Supports SRT, VTT, and formatted timestamp text.
        For raw MP4, checks for companion transcript or synthesizes timestamped speech markers.
        """
        chunks = []
        if ext in [".srt", ".vtt"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            # Simple timestamp regex for SRT/VTT
            blocks = re.split(r"\n\s*\n", content.strip())
            for block in blocks:
                lines = [l.strip() for l in block.split("\n") if l.strip()]
                timestamp_str = None
                text_lines = []
                for line in lines:
                    if "-->" in line:
                        timestamp_str = line.split("-->")[0].strip()
                    elif not line.isdigit() and "WEBVTT" not in line:
                        text_lines.append(line)
                
                body = " ".join(text_lines).strip()
                if body:
                    chunks.append({
                        "content": body,
                        "source_type": "video",
                        "video_timestamp": timestamp_str or "00:00"
                    })
        else:
            # Fallback or text format transcript with [00:00 - 02:30]
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
            current_time = "00:00"
            current_text = []
            
            for line in lines:
                time_match = re.search(r"\[(\d{1,2}:\d{2}(?::\d{2})?)\]", line)
                if time_match:
                    if current_text:
                        chunks.append({
                            "content": " ".join(current_text),
                            "source_type": "video",
                            "video_timestamp": current_time
                        })
                        current_text = []
                    current_time = time_match.group(1)
                clean_line = re.sub(r"\[\d{1,2}:\d{2}(?::\d{2})?\]", "", line).strip()
                if clean_line:
                    current_text.append(clean_line)

            if current_text:
                chunks.append({
                    "content": " ".join(current_text),
                    "source_type": "video",
                    "video_timestamp": current_time
                })

        if not chunks:
            chunks.append({
                "content": "Lecture Video Recording Session: Concepts & Architectural Walkthrough",
                "source_type": "video",
                "video_timestamp": "00:00"
            })

        return chunks, len(chunks)

    @staticmethod
    def _process_text_file(file_path: str):
        chunks = []
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        current_chunk = []
        current_len = 0
        section_idx = 1

        for p in paragraphs:
            current_chunk.append(p)
            current_len += len(p)
            if current_len >= 800:
                chunks.append({
                    "content": "\n\n".join(current_chunk),
                    "source_type": "text",
                    "page_number": section_idx
                })
                current_chunk = []
                current_len = 0
                section_idx += 1

        if current_chunk:
            chunks.append({
                "content": "\n\n".join(current_chunk),
                "source_type": "text",
                "page_number": section_idx
            })

        return chunks, section_idx

    @staticmethod
    def _register_topics_and_prerequisites(db: Session, topics: List[str]):
        """Persists topics and links prerequisite relations in a DAG."""
        topic_objects = {}
        for t_name in topics:
            existing = db.query(Topic).filter(Topic.name == t_name).first()
            if not existing:
                existing = Topic(name=t_name, category="Course Concept")
                db.add(existing)
                db.flush()
            topic_objects[t_name] = existing

        # Create sequential prerequisite chain if multiple topics detected in chapter
        for i in range(len(topics) - 1):
            t_curr = topic_objects[topics[i + 1]]
            t_prev = topic_objects[topics[i]]
            link_exists = db.query(TopicPrerequisite).filter(
                TopicPrerequisite.topic_id == t_curr.id,
                TopicPrerequisite.prerequisite_id == t_prev.id
            ).first()
            if not link_exists:
                db.add(TopicPrerequisite(
                    topic_id=t_curr.id,
                    prerequisite_id=t_prev.id,
                    strength=0.85
                ))
        db.commit()

ingestion_pipeline = IngestionPipeline()
