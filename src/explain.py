"""
Explainable AI (XAI) and Token Attribution Engine for News Credibility.
"""

from typing import List, Dict, Any, Tuple
import html
import re
from src.config import SENSATIONAL_MARKERS, JOURNALISTIC_MARKERS


def explain_prediction(
    text: str,
    vectorizer: Any,
    classifier: Any,
    top_k: int = 8
) -> Dict[str, Any]:
    """
    Computes feature attributions using TF-IDF weights and linear model coefficients.
    Returns categorized tokens (suspicious vs credible) and an annotated HTML preview.
    """
    if not text or not vectorizer or not classifier:
        return {
            "top_deceptive_tokens": [],
            "top_credible_tokens": [],
            "annotated_html": html.escape(text),
            "explanation_summary": "Insufficient text provided for explainability analysis."
        }

    # Extract vocabulary and linear model weights
    try:
        feature_names = vectorizer.get_feature_names_out()
        # Binary classification: coefficient > 0 means class 1 (Fake), < 0 means class 0 (Real)
        # Note: If calibrated classifier is passed, we check base_estimator or calibrated_classifiers_
        if hasattr(classifier, "coef_"):
            coef = classifier.coef_[0]
        elif hasattr(classifier, "calibrated_classifiers_"):
            coef = classifier.calibrated_classifiers_[0].estimator.coef_[0]
        else:
            coef = None
    except Exception:
        coef = None

    tokens = re.findall(r"\b[A-Za-z0-9'-]+\b", text)
    token_scores: Dict[str, float] = {}

    if coef is not None and feature_names is not None:
        feature_idx_map = {feat: idx for idx, feat in enumerate(feature_names)}
        for token in tokens:
            lower_token = token.lower()
            if lower_token in feature_idx_map:
                idx = feature_idx_map[lower_token]
                weight = float(coef[idx])
                token_scores[lower_token] = weight

    # Sort tokens
    deceptive_sorted = sorted(
        [(k, v) for k, v in token_scores.items() if v > 0],
        key=lambda x: x[1],
        reverse=True
    )[:top_k]

    credible_sorted = sorted(
        [(k, v) for k, v in token_scores.items() if v < 0],
        key=lambda x: x[1]
    )[:top_k]

    # Build annotated HTML
    annotated_words: List[str] = []
    lower_text = text.lower()

    for word in text.split():
        clean_word = re.sub(r"[^\w-]", "", word).lower()
        score = token_scores.get(clean_word, 0.0)
        is_sensational = any(m in clean_word for m in SENSATIONAL_MARKERS)

        if score > 0.4 or is_sensational:
            # High deceptive impact
            annotated_words.append(
                f'<mark class="token-deceptive" title="Manipulative/Fake signal (+{score:.2f})">{html.escape(word)}</mark>'
            )
        elif score < -0.4:
            # High credible impact
            annotated_words.append(
                f'<mark class="token-credible" title="Credibility marker ({score:.2f})">{html.escape(word)}</mark>'
            )
        else:
            annotated_words.append(html.escape(word))

    annotated_html = " ".join(annotated_words)

    # Narrative explanation
    if len(deceptive_sorted) > 0 and len(credible_sorted) == 0:
        summary = (
            f"Article displays strong linguistic markers associated with misinformation. "
            f"Top trigger terms include: {', '.join([f'\"{w[0]}\"' for w in deceptive_sorted[:4]])}."
        )
    elif len(credible_sorted) > 0 and len(deceptive_sorted) == 0:
        summary = (
            f"Article displays balanced, verified journalistic markers. "
            f"Key credibility terms include: {', '.join([f'\"{w[0]}\"' for w in credible_sorted[:4]])}."
        )
    else:
        summary = (
            f"Prediction derived from weighted lexical analysis. "
            f"Identified {len(deceptive_sorted)} deceptive signals vs {len(credible_sorted)} credibility indicators."
        )

    return {
        "top_deceptive_tokens": [{"token": w[0], "weight": round(w[1], 3)} for w in deceptive_sorted],
        "top_credible_tokens": [{"token": w[0], "weight": round(abs(w[1]), 3)} for w in credible_sorted],
        "annotated_html": annotated_html,
        "explanation_summary": summary,
    }
