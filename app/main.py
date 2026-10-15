"""
FastAPI Application and REST API Endpoints for Fake News Detection.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from src.config import STATIC_DIR, METADATA_FILE, SAMPLE_DATA_FILE
from src.model import FakeNewsClassifier

app = FastAPI(
    title="Veritas AI - Fake News Detection API",
    description="Production-grade NLP pipeline for news credibility and misinformation analysis.",
    version="2.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
classifier = FakeNewsClassifier()


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=50000, description="Headline or body of news article")


class TokenAttribution(BaseModel):
    token: str
    weight: float


class ExplanationResponse(BaseModel):
    top_deceptive_tokens: List[TokenAttribution]
    top_credible_tokens: List[TokenAttribution]
    annotated_html: str
    explanation_summary: str


class StylometricsResponse(BaseModel):
    char_count: int
    word_count: int
    uppercase_ratio: float
    exclamation_count: int
    question_count: int
    quote_count: int
    avg_word_length: float
    sensationalism_score: float
    journalistic_score: float
    sensational_matches: List[str]
    journalistic_matches: List[str]


class PredictResponse(BaseModel):
    verdict: str
    is_fake: bool
    credibility_score: float
    fake_probability: float
    confidence_level: str
    stylometrics: StylometricsResponse
    explanation: ExplanationResponse


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    """Health check endpoint reporting model status."""
    return {
        "status": "healthy",
        "model_loaded": classifier.is_loaded,
        "version": "2.0.0",
    }


@app.get("/api/samples")
def get_sample_articles() -> List[Dict[str, Any]]:
    """Returns curated preset real and fake news articles for interactive testing."""
    if not SAMPLE_DATA_FILE.exists():
        return []
    try:
        with open(SAMPLE_DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read samples: {str(e)}")


@app.get("/api/metrics")
def get_model_metrics() -> Dict[str, Any]:
    """Returns model evaluation metadata and benchmark metrics."""
    if not METADATA_FILE.exists():
        return {"error": "Metadata file not found. Please run trainer.py first."}
    try:
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read metadata: {str(e)}")


@app.post("/api/predict", response_model=PredictResponse)
def predict_news(request: PredictRequest) -> Dict[str, Any]:
    """
    Analyzes news headline or full text.
    Returns credibility score, fake vs real verdict, stylometric metrics, and XAI token highlights.
    """
    clean_input = request.text.strip()
    if len(clean_input) < 5:
        raise HTTPException(status_code=400, detail="Text must contain at least 5 characters.")

    result = classifier.predict(clean_input)
    return result


# Mount static assets for frontend UI
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
def serve_index() -> FileResponse:
    """Serves the main single-page web UI."""
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="Frontend UI not found.")
    return FileResponse(index_file)
