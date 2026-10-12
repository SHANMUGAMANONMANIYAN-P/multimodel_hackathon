import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "EduAdapt AI" in data["app"]

def test_demo_user_login():
    response = client.post("/api/v1/auth/login", json={
        "email": "student@eduadapt.ai",
        "password": "password123"
    })
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["user"]["email"] == "student@eduadapt.ai"

def test_dashboard_metrics():
    # Login first
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@eduadapt.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dash_res = client.get("/api/v1/analytics/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_materials"] >= 3
    assert len(dash_data["topic_masteries"]) > 0
    assert "overall_mastery" in dash_data

def test_grounded_tutor_chat_and_refusal():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@eduadapt.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. In-corpus query should return citations
    query_in = "What does the Hessian matrix characterize in loss surface optimization?"
    chat_res = client.post("/api/v1/tutor/chat", json={"content": query_in}, headers=headers)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["refusal_flag"] is False
    assert len(chat_data["citations"]) > 0

    # 2. Unsupported query should trigger refusal
    query_out = "What are the quantum superconductivity vortex lines in helium-4 superfluid?"
    refusal_res = client.post("/api/v1/tutor/chat", json={"content": query_out}, headers=headers)
    assert refusal_res.status_code == 200
    refusal_data = refusal_res.json()
    assert refusal_data["refusal_flag"] is True
    assert "couldn't verify" in refusal_data["content"].lower()
