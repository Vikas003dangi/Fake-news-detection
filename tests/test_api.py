"""
Integration tests for FastAPI endpoints.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True


def test_samples_endpoint():
    response = client.get("/api/samples")
    assert response.status_code == 200
    samples = response.json()
    assert isinstance(samples, list)
    assert len(samples) >= 3


def test_metrics_endpoint():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "benchmark_comparison" in data or "full_dataset_metrics" in data


def test_predict_endpoint_success():
    payload = {
        "text": "According to official reports released by Reuters, international monitors verified the statement."
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "credibility_score" in data
    assert "verdict" in data
    assert "stylometrics" in data
    assert "explanation" in data
    assert "sentence_analysis" in data
    assert data["sentence_analysis"]["sentence_count"] >= 1


def test_predict_endpoint_validation_error():
    payload = {"text": "abc"}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 422  # Pydantic validation error (min_length=5)


def test_scrape_url_endpoint_validation_error():
    payload = {"url": "short"}
    response = client.post("/api/scrape-url", json=payload)
    assert response.status_code == 422

