"""
Sentence-Level Credibility Heatmap and Granular Forensic Analyzer.
"""

import re
from typing import List, Dict, Any
from src.config import SENSATIONAL_MARKERS, JOURNALISTIC_MARKERS


def analyze_sentence_flow(article_text: str, model_wrapper: Any) -> Dict[str, Any]:
    """
    Splits text into individual sentences and performs granular credibility scoring
    to generate an interactive risk heatmap.
    """
    if not article_text or not isinstance(article_text, str):
        return {
            "sentence_count": 0,
            "sentences": [],
            "credible_ratio": 0.0,
            "questionable_ratio": 0.0,
            "misinformation_ratio": 0.0,
        }

    # Split into sentences using punctuation boundaries
    raw_sentences = re.split(r"(?<=[.!?])\s+", article_text.strip())
    sentences = [s.strip() for s in raw_sentences if len(s.strip()) > 8]

    if not sentences:
        sentences = [article_text.strip()]

    evaluated_sentences = []
    credible_count = 0
    questionable_count = 0
    misinformation_count = 0

    for idx, sentence in enumerate(sentences, start=1):
        lower = sentence.lower()
        sens_found = [m for m in SENSATIONAL_MARKERS if m in lower]
        journ_found = [m for m in JOURNALISTIC_MARKERS if m in lower]

        # Fast prediction per sentence
        score = 55.0
        if model_wrapper and hasattr(model_wrapper, "predict"):
            try:
                pred = model_wrapper.predict(sentence, include_sentences=False)
            except TypeError:
                pred = model_wrapper.predict(sentence)
            score = pred.get("credibility_score", 55.0)
        else:
            # Fallback heuristic
            score = 65.0 - (len(sens_found) * 25.0) + (len(journ_found) * 20.0)
            score = max(5.0, min(95.0, score))

        if score >= 60.0:
            status = "CREDIBLE"
            credible_count += 1
        elif score >= 40.0:
            status = "QUESTIONABLE"
            questionable_count += 1
        else:
            status = "MISINFORMATION"
            misinformation_count += 1

        evaluated_sentences.append({
            "index": idx,
            "text": sentence,
            "credibility_score": round(score, 1),
            "status": status,
            "sensational_triggers": sens_found,
            "journalistic_markers": journ_found,
        })

    total = len(sentences)
    return {
        "sentence_count": total,
        "sentences": evaluated_sentences,
        "credible_ratio": round((credible_count / total) * 100, 1),
        "questionable_ratio": round((questionable_count / total) * 100, 1),
        "misinformation_ratio": round((misinformation_count / total) * 100, 1),
    }
