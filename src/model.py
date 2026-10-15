"""
Fake News Classifier Model Wrapper and Inference Engine.
"""

from pathlib import Path
from typing import Dict, Any, Optional
import joblib
import numpy as np

from src.config import MODEL_FILE, METADATA_FILE
from src.preprocessor import clean_text, extract_stylometric_features
from src.explain import explain_prediction
from src.sentence_analyzer import analyze_sentence_flow


class FakeNewsClassifier:
    """
    Production inference engine combining calibrated linear classifiers,
    stylometric telemetry, and explainable AI token attribution.
    """

    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or MODEL_FILE
        self.bundle: Optional[Dict[str, Any]] = None
        self.vectorizer = None
        self.classifier = None
        self.is_loaded = False
        self._load()

    def _load(self) -> None:
        """Loads serialized model bundle if available."""
        if self.model_path.exists():
            try:
                self.bundle = joblib.load(self.model_path)
                self.vectorizer = self.bundle.get("vectorizer")
                self.classifier = self.bundle.get("classifier")
                self.is_loaded = True
            except Exception as e:
                print(f"[Warning] Failed to load model bundle from {self.model_path}: {e}")
                self.is_loaded = False
        else:
            self.is_loaded = False

    def predict(self, raw_text: str, include_sentences: bool = True) -> Dict[str, Any]:
        """
        Runs end-to-end inference on the input text.
        Returns predicted verdict, credibility score, stylometric telemetry,
        XAI token attribution, and sentence credibility heatmap.
        """
        if not raw_text or not raw_text.strip():
            return {
                "verdict": "UNKNOWN",
                "is_fake": False,
                "credibility_score": 50.0,
                "fake_probability": 0.5,
                "confidence_level": "LOW",
                "stylometrics": extract_stylometric_features(""),
                "explanation": {
                    "top_deceptive_tokens": [],
                    "top_credible_tokens": [],
                    "annotated_html": "",
                    "explanation_summary": "Empty input text.",
                },
                "sentence_analysis": None,
            }

        # Extract stylometrics from original raw text
        stylometrics = extract_stylometric_features(raw_text)

        # Preprocess text
        cleaned = clean_text(raw_text, remove_stopwords=True)

        if not self.is_loaded or self.vectorizer is None or self.classifier is None:
            # Fallback heuristic engine if weights file hasn't been generated yet
            sens_score = stylometrics["sensationalism_score"]
            journ_score = stylometrics["journalistic_score"]
            fake_prob = max(0.05, min(0.95, (sens_score - journ_score + 50.0) / 100.0))
        else:
            # Vectorize text
            vec_input = self.vectorizer.transform([cleaned])

            # Predict probability
            if hasattr(self.classifier, "predict_proba"):
                proba = self.classifier.predict_proba(vec_input)[0]
                # Index 1 = Fake, Index 0 = Real
                fake_prob = float(proba[1]) if len(proba) > 1 else float(proba[0])
            elif hasattr(self.classifier, "decision_function"):
                dec = float(self.classifier.decision_function(vec_input)[0])
                # Sigmoid mapping
                fake_prob = 1.0 / (1.0 + np.exp(-dec))
            else:
                pred = self.classifier.predict(vec_input)[0]
                fake_prob = 0.95 if pred == 1 else 0.05

        # Heuristic blending (incorporate extreme sensationalism flags)
        if stylometrics["sensationalism_score"] > 75.0 and fake_prob < 0.70:
            fake_prob = min(0.95, fake_prob + 0.15)
        elif stylometrics["journalistic_score"] > 70.0 and fake_prob > 0.35:
            fake_prob = max(0.05, fake_prob - 0.15)

        fake_prob = round(float(fake_prob), 4)
        credibility_score = round((1.0 - fake_prob) * 100.0, 1)

        # Verdict and confidence categorization
        if fake_prob >= 0.70:
            verdict = "FAKE / MISINFORMATION"
            is_fake = True
            confidence = "HIGH" if fake_prob >= 0.85 else "MODERATE"
        elif fake_prob >= 0.50:
            verdict = "QUESTIONABLE / UNVERIFIED"
            is_fake = True
            confidence = "MODERATE" if fake_prob >= 0.60 else "LOW"
        elif fake_prob >= 0.30:
            verdict = "LEANING CREDIBLE"
            is_fake = False
            confidence = "MODERATE"
        else:
            verdict = "AUTHENTIC / CREDIBLE"
            is_fake = False
            confidence = "HIGH" if fake_prob <= 0.15 else "MODERATE"

        # Generate explainability
        explanation = explain_prediction(
            text=raw_text,
            vectorizer=self.vectorizer,
            classifier=self.classifier,
            top_k=8
        )

        # Sentence-level credibility flow heatmap
        sentence_analysis = analyze_sentence_flow(raw_text, self) if include_sentences else None

        return {
            "verdict": verdict,
            "is_fake": is_fake,
            "credibility_score": credibility_score,
            "fake_probability": fake_prob,
            "confidence_level": confidence,
            "stylometrics": stylometrics,
            "explanation": explanation,
            "sentence_analysis": sentence_analysis,
        }
