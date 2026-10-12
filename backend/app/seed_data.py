import os
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.models import (
    User,
    Material,
    ExtractedChunk,
    Topic,
    TopicPrerequisite,
    TopicMastery,
    TopicMasteryHistory,
    LearningActivity
)
from app.services.embedding import embedding_service
from app.core.config import settings

def seed_database():
    """Initializes schema and seeds realistic course materials and learner data."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Create or retrieve demo student
        demo_user = db.query(User).filter(User.email == "student@eduadapt.ai").first()
        if not demo_user:
            demo_user = User(
                email="student@eduadapt.ai",
                hashed_password=get_password_hash("password123"),
                full_name="Alex Rivera",
                role="student"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print("[Seed] Created default user: student@eduadapt.ai / password123")

        # 2. Seed Topics & Prerequisites
        topic_data = [
            ("Linear Algebra & Eigenvalues", "Vector spaces, linear transformations, matrices, and spectral decompositions.", "Mathematics"),
            ("Gradient Descent Optimization", "First-order iterative optimization algorithms for finding local minima.", "Optimization"),
            ("Neural Network Architectures", "Multi-layer perceptrons, forward propagation, and representation learning.", "Deep Learning"),
            ("Backpropagation & Chain Rule", "Automated differentiation and backward gradient accumulation.", "Deep Learning"),
            ("Transformers & Attention", "Self-attention mechanisms, multi-head attention, and sequence modeling.", "Modern AI")
        ]

        topic_map = {}
        for name, desc, cat in topic_data:
            t = db.query(Topic).filter(Topic.name == name).first()
            if not t:
                t = Topic(name=name, description=desc, category=cat)
                db.add(t)
                db.flush()
            topic_map[name] = t

        # Prerequisite links
        prereq_pairs = [
            ("Linear Algebra & Eigenvalues", "Neural Network Architectures", 0.90),
            ("Gradient Descent Optimization", "Backpropagation & Chain Rule", 0.85),
            ("Neural Network Architectures", "Transformers & Attention", 0.95),
            ("Backpropagation & Chain Rule", "Transformers & Attention", 0.75)
        ]
        for p_name, t_name, strength in prereq_pairs:
            t_obj = topic_map.get(t_name)
            p_obj = topic_map.get(p_name)
            if t_obj and p_obj:
                exists = db.query(TopicPrerequisite).filter(
                    TopicPrerequisite.topic_id == t_obj.id,
                    TopicPrerequisite.prerequisite_id == p_obj.id
                ).first()
                if not exists:
                    db.add(TopicPrerequisite(
                        topic_id=t_obj.id,
                        prerequisite_id=p_obj.id,
                        strength=strength
                    ))

        # 3. Seed Topic Mastery for demo user
        mastery_initials = [
            ("Linear Algebra & Eigenvalues", 0.42, "DEVELOPING", 4, 2),
            ("Gradient Descent Optimization", 0.32, "NOVICE", 6, 2),
            ("Neural Network Architectures", 0.78, "PROFICIENT", 7, 6),
            ("Backpropagation & Chain Rule", 0.55, "DEVELOPING", 5, 3),
            ("Transformers & Attention", 0.88, "MASTERED", 10, 9)
        ]

        for t_name, m_val, state, tot, corr in mastery_initials:
            t_rec = db.query(TopicMastery).filter(
                TopicMastery.user_id == demo_user.id,
                TopicMastery.topic_name == t_name
            ).first()
            if not t_rec:
                t_obj = topic_map.get(t_name)
                t_rec = TopicMastery(
                    user_id=demo_user.id,
                    topic_id=t_obj.id if t_obj else None,
                    topic_name=t_name,
                    p_l0=settings.BKT_DEFAULT_L0,
                    p_t=settings.BKT_DEFAULT_T,
                    p_g=settings.BKT_DEFAULT_G,
                    p_s=settings.BKT_DEFAULT_S,
                    current_mastery=m_val,
                    mastery_state=state,
                    total_practices=tot,
                    correct_practices=corr
                )
                db.add(t_rec)

        # 4. Check if materials already seeded
        mat_count = db.query(Material).filter(Material.user_id == demo_user.id).count()
        if mat_count == 0:
            # Material A: PDF Textbook Chapter
            mat_pdf = Material(
                user_id=demo_user.id,
                title="Deep Learning Foundations - Chapter 4: Optimization",
                original_filename="deep_learning_ch4_optimization.pdf",
                file_path=os.path.join(settings.UPLOAD_DIR, "deep_learning_ch4_optimization.pdf"),
                file_type="pdf",
                file_size=2048500,
                status="completed",
                total_pages_or_slides=14,
                summary="Rigorous coverage of loss surfaces, gradient descent algorithms, momentum, adaptive learning rates, and eigenvalue bounds on convergence rates.",
                detected_topics=json.dumps(["Gradient Descent Optimization", "Linear Algebra & Eigenvalues", "Backpropagation & Chain Rule"])
            )
            db.add(mat_pdf)
            db.flush()

            # Chunks for Material A
            chunks_pdf = [
                (
                    "Chapter 4.1: Mathematical Properties of Gradient Descent.\n"
                    "Let f: R^n -> R be a continuously differentiable objective function. The gradient ∇f(w) defines the vector of partial derivatives [∂f/∂w1, ..., ∂f/∂wn]^T. "
                    "The gradient points strictly in the direction of greatest instantaneous rate of increase. Consequently, moving in the negative gradient direction -∇f(w) "
                    "guarantees steepest descent in the local neighborhood. The iterative parameter update rule is w_{t+1} = w_t - η ∇f(w_t), where η > 0 is the learning rate.",
                    "pdf", 2, None, None, ["Gradient Descent Optimization"], "Contains schematic of gradient vector on contour curves"
                ),
                (
                    "Chapter 4.2: Conditioning and Curvature via the Hessian Matrix.\n"
                    "The second-order curvature of the loss surface is governed by the Hessian matrix H = ∇^2 f(w). "
                    "The eigenvalues λ_min and λ_max of the Hessian characterize the condition number κ = λ_max / λ_min. "
                    "When the condition number is large (ill-conditioned curvature), standard gradient descent oscillates severely across steep ravine walls "
                    "while making minuscule progress along the gentle valley floor toward the optimum. Setting the learning rate η > 2 / λ_max causes catastrophic divergence.",
                    "pdf", 5, None, None, ["Linear Algebra & Eigenvalues", "Gradient Descent Optimization"], "Hessian eigenvalue spectral ellipse diagram"
                ),
                (
                    "Chapter 4.3: Momentum and Accelerated Convergence.\n"
                    "Classical momentum accelerates gradient vectors in directions of consistent descent while dampening high-frequency orthogonal oscillations. "
                    "The velocity accumulation vector is defined as v_{t+1} = β v_t + ∇f(w_t), followed by the parameter update w_{t+1} = w_t - η v_{t+1}, "
                    "where β ∈ [0.9, 0.99] represents the momentum coefficient. This acts as physical inertia, enabling optimization to escape shallow saddle points.",
                    "pdf", 8, None, None, ["Gradient Descent Optimization"], None
                )
            ]

            for idx, (content, stype, pnum, snum, vtime, tags, fig) in enumerate(chunks_pdf):
                emb = embedding_service.get_embedding(content)
                db.add(ExtractedChunk(
                    material_id=mat_pdf.id,
                    chunk_index=idx,
                    content=content,
                    source_type=stype,
                    page_number=pnum,
                    slide_number=snum,
                    video_timestamp=vtime,
                    token_count=len(content.split()),
                    topic_tags=json.dumps(tags),
                    figure_description=fig,
                    embedding=json.dumps(emb)
                ))

            # Material B: PPTX Lecture Slides
            mat_pptx = Material(
                user_id=demo_user.id,
                title="Lecture Slides: Neural Network Architectures & Multi-Head Attention",
                original_filename="lecture_slides_nn_attention.pptx",
                file_path=os.path.join(settings.UPLOAD_DIR, "lecture_slides_nn_attention.pptx"),
                file_type="pptx",
                file_size=5120000,
                status="completed",
                total_pages_or_slides=24,
                summary="Architecture diagrams for Multi-Layer Perceptrons, Scaled Dot-Product Attention, and Transformer Encoder-Decoder stacks.",
                detected_topics=json.dumps(["Neural Network Architectures", "Transformers & Attention"])
            )
            db.add(mat_pptx)
            db.flush()

            chunks_pptx = [
                (
                    "Slide 6: Feedforward Layer and Non-linear Activations.\n"
                    "- Linear projection: z = W x + b\n"
                    "- Activation functions: ReLU(z) = max(0, z), GELU(z) = z Φ(z)\n"
                    "- Without non-linear activation functions, a composition of arbitrary depth collapses mathematically into a single matrix multiplication W_composite = W_L ... W_1.\n"
                    "[Speaker Notes]: Emphasize to students that non-linearity is what grants universal function approximation capabilities (Cybenko 1989).",
                    "pptx", None, 6, None, ["Neural Network Architectures"], "Layer activation flow diagram"
                ),
                (
                    "Slide 14: Scaled Dot-Product Attention Mechanism.\n"
                    "- Given Query Q, Key K, and Value V matrices with key dimensionality d_k:\n"
                    "- Attention(Q, K, V) = softmax( (Q K^T) / sqrt(d_k) ) V\n"
                    "- Why scale by sqrt(d_k)? For large d_k, dot products grow substantially in magnitude, pushing softmax into regions with vanishingly small gradients.\n"
                    "- Multi-Head Attention projects Q, K, V into h distinct representation subspaces.",
                    "pptx", None, 14, None, ["Transformers & Attention"], "Attention matrix dot-product routing schematic"
                )
            ]

            for idx, (content, stype, pnum, snum, vtime, tags, fig) in enumerate(chunks_pptx):
                emb = embedding_service.get_embedding(content)
                db.add(ExtractedChunk(
                    material_id=mat_pptx.id,
                    chunk_index=idx,
                    content=content,
                    source_type=stype,
                    page_number=pnum,
                    slide_number=snum,
                    video_timestamp=vtime,
                    token_count=len(content.split()),
                    topic_tags=json.dumps(tags),
                    figure_description=fig,
                    embedding=json.dumps(emb)
                ))

            # Material C: Video Lecture with Timestamps
            mat_video = Material(
                user_id=demo_user.id,
                title="Lecture 08: Reverse-Mode Automated Differentiation & Backpropagation",
                original_filename="lecture_08_backprop_autodiff.srt",
                file_path=os.path.join(settings.UPLOAD_DIR, "lecture_08_backprop_autodiff.srt"),
                file_type="video",
                file_size=124000,
                status="completed",
                total_pages_or_slides=3,
                summary="Step-by-step breakdown of computational graphs, chain rule decomposition, and memory management during backward gradient passes.",
                detected_topics=json.dumps(["Backpropagation & Chain Rule", "Gradient Descent Optimization"])
            )
            db.add(mat_video)
            db.flush()

            chunks_video = [
                (
                    "[00:00 - 04:30] Welcome everyone to Lecture 8. Today we are unpacking reverse-mode automatic differentiation, popularly known as backpropagation. "
                    "When evaluating a neural computational DAG, we first execute a forward pass to evaluate node activations and cache intermediate states. "
                    "During the backward pass, we apply the multivariate chain rule: ∂L/∂x = ∑ (∂L/∂y_i) * (∂y_i/∂x).",
                    "video", None, None, "02:15", ["Backpropagation & Chain Rule"], None
                ),
                (
                    "[04:31 - 09:45] Notice why reverse mode is so computationally efficient: for scalar loss L and N parameters, reverse mode computes all N partial derivatives "
                    "in a single backward sweep with computational cost proportional to roughly 2 to 3 times the forward pass. "
                    "In contrast, forward-mode differentiation would require N separate passes, making it intractable for modern deep networks.",
                    "video", None, None, "06:40", ["Backpropagation & Chain Rule"], "DAG computational graph schematic"
                )
            ]

            for idx, (content, stype, pnum, snum, vtime, tags, fig) in enumerate(chunks_video):
                emb = embedding_service.get_embedding(content)
                db.add(ExtractedChunk(
                    material_id=mat_video.id,
                    chunk_index=idx,
                    content=content,
                    source_type=stype,
                    page_number=pnum,
                    slide_number=snum,
                    video_timestamp=vtime,
                    token_count=len(content.split()),
                    topic_tags=json.dumps(tags),
                    figure_description=fig,
                    embedding=json.dumps(emb)
                ))

            # Log seed activities
            db.add(LearningActivity(
                user_id=demo_user.id,
                activity_type="upload",
                title="Added Course Textbook (PDF)",
                details=json.dumps({"pages": 14})
            ))
            db.add(LearningActivity(
                user_id=demo_user.id,
                activity_type="assessment",
                title="Completed Diagnostic Quiz (68%)",
                details=json.dumps({"score": 3.4, "max": 5.0})
            ))

            db.commit()
            print("[Seed] Seeded sample multimodal materials, chunks, topics, and initial BKT states successfully!")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
