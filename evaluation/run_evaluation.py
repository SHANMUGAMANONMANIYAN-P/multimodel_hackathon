#!/usr/bin/env python3
"""
EduAdapt AI - Standalone CLI Evaluation & Benchmark Runner
Computes RAGAS-compatible metrics:
- Faithfulness
- Citation Accuracy
- Context Precision & Recall
- Unsupported Query Refusal Rate
- Bayesian Knowledge Tracing Learner Convergence
"""

import sys
import os
import json

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal, Base, engine
from app.seed_data import seed_database
from app.services.evaluation import evaluation_service

def main():
    print("=" * 65)
    print("  EduAdapt AI — Benchmark & Evaluation Suite (Hackathon 2026)")
    print("=" * 65)
    print("[1/3] Initializing database and ensuring seed materials are loaded...")
    Base.metadata.create_all(bind=engine)
    seed_database()

    db = SessionLocal()
    try:
        print("[2/3] Executing multimodal benchmark across test set...")
        run_record = evaluation_service.run_benchmark(db, run_name="CLI Evaluation Suite Run")
        metrics = json.loads(run_record.metrics)
        simulations = json.loads(run_record.learner_simulations)

        print("\n" + "=" * 65)
        print("  BENCHMARK RESULTS & METRICS")
        print("=" * 65)
        print(f"  • Faithfulness:                   {metrics['faithfulness'] * 100:.1f}%")
        print(f"  • Answer Relevancy:               {metrics['answer_relevancy'] * 100:.1f}%")
        print(f"  • Context Precision:              {metrics['context_precision'] * 100:.1f}%")
        print(f"  • Context Recall:                 {metrics['context_recall'] * 100:.1f}%")
        print(f"  • Citation Accuracy:              {metrics['citation_accuracy'] * 100:.1f}%")
        print(f"  • Unsupported Refusal Rate:       {metrics['unsupported_refusal_rate'] * 100:.1f}%")
        print(f"  • Question Verification Rate:     {metrics['question_verification_rate'] * 100:.1f}%")
        print(f"  • Question Duplication Rate:      {metrics['question_repetition_rate'] * 100:.1f}%")
        print("=" * 65)

        print("\n[3/3] SYNTHETIC LEARNER BKT SIMULATION (8 Rounds):")
        for profile, data in simulations.items():
            print(f"  • {profile:12}: Initial Mastery = {data['initial_mastery']*100:.0f}%, Final Mastery = {data['final_mastery']*100:.0f}% (Mastered in {data['sessions_to_mastery']} sessions)")

        print("\nAll evaluation metrics stored in database under run ID:", run_record.id)
        print("=" * 65)
    finally:
        db.close()

if __name__ == "__main__":
    main()
