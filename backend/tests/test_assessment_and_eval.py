import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_assessment_generation_and_grading():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@eduadapt.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Generate assessment
    gen_res = client.post("/api/v1/assessments/generate", json={
        "topic_name": "Gradient Descent Optimization",
        "difficulty": "Medium",
        "question_count": 3
    }, headers=headers)
    assert gen_res.status_code == 200
    quiz = gen_res.json()
    assert quiz["question_count"] == 3
    assert len(quiz["questions"]) == 3
    
    # Verify fingerprint existence
    for q in quiz["questions"]:
        assert len(q["fingerprint"]) > 0

    # Submit answers
    submission_answers = []
    for q in quiz["questions"]:
        # If options exist, pick first option
        resp = q["options"][0] if q["options"] else "6"
        submission_answers.append({
            "question_id": q["id"],
            "student_response": resp
        })

    submit_res = client.post(f"/api/v1/assessments/{quiz['id']}/submit", json={
        "time_spent_seconds": 120,
        "answers": submission_answers
    }, headers=headers)
    assert submit_res.status_code == 200
    result = submit_res.json()
    assert "score" in result
    assert "percentage" in result
    assert len(result["mastery_updates"]) > 0
    # Verify BKT update explanation exists
    assert "BKT updated mastery" in result["mastery_updates"][0]["explanation"]

def test_evaluation_benchmark_trigger():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@eduadapt.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    eval_res = client.post("/api/v1/evaluation/run", json={
        "dataset_name": "Hackathon 2026 Test Set",
        "simulate_learners": True
    }, headers=headers)
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["status"] == "completed"
    assert "faithfulness" in eval_data["metrics"]
    assert "unsupported_refusal_rate" in eval_data["metrics"]
    assert "Beginner" in eval_data["learner_simulations"]
    assert len(eval_data["learner_simulations"]["Beginner"]["trajectory"]) == 9
