"""
Text Preprocessing and Stylometric Feature Extraction Module.
"""

import re
from typing import Dict, Any, List
from src.config import STOPWORDS, SENSATIONAL_MARKERS, JOURNALISTIC_MARKERS


def clean_text(text: str, remove_stopwords: bool = True) -> str:
    """
    Cleans raw news text by removing HTML, URLs, non-alphanumeric noise,
    and optional stopwords while preserving semantic text.
    """
    if not isinstance(text, str):
        return ""

    # Strip HTML tags
    cleaned = re.sub(r"<[^>]+>", " ", text)

    # Strip URLs
    cleaned = re.sub(r"https?://\S+|www\.\S+", " ", cleaned)

    # Strip email addresses
    cleaned = re.sub(r"\S+@\S+", " ", cleaned)

    # Convert contractions and special apostrophes
    cleaned = cleaned.replace("’", "'").replace("“", '"').replace("”", '"')

    # Remove non-alphanumeric characters (keep basic spaces and hyphens)
    cleaned = re.sub(r"[^a-zA-Z0-9\s-]", " ", cleaned)

    # Lowercase
    cleaned = cleaned.lower()

    # Normalize whitespace
    words = cleaned.split()

    if remove_stopwords:
        words = [w for w in words if w not in STOPWORDS and len(w) > 1]

    return " ".join(words)


def extract_stylometric_features(raw_text: str) -> Dict[str, Any]:
    """
    Extracts stylometric, emotional, and journalistic credibility indicators
    from the raw, unnormalized text.
    """
    if not raw_text or not isinstance(raw_text, str):
        return {
            "char_count": 0,
            "word_count": 0,
            "uppercase_ratio": 0.0,
            "exclamation_count": 0,
            "question_count": 0,
            "quote_count": 0,
            "avg_word_length": 0.0,
            "sensationalism_score": 0.0,
            "journalistic_score": 0.0,
            "sensational_matches": [],
            "journalistic_matches": [],
        }

    total_chars = len(raw_text)
    words = raw_text.split()
    total_words = len(words) if words else 1

    # Ratio of uppercase letters (excessive ALL-CAPS indicates clickbait/ragebait)
    upper_chars = sum(1 for c in raw_text if c.isupper())
    uppercase_ratio = round((upper_chars / total_chars) * 100, 2) if total_chars > 0 else 0.0

    # Punctuation heuristics
    exclamation_count = raw_text.count("!")
    question_count = raw_text.count("?")
    quote_count = raw_text.count('"') + raw_text.count("'")

    # Average word length
    total_word_len = sum(len(w) for w in words)
    avg_word_length = round(total_word_len / total_words, 2)

    # Marker scanning (case-insensitive substring match)
    lower_text = raw_text.lower()
    sensational_found = [m for m in SENSATIONAL_MARKERS if m in lower_text]
    journalistic_found = [m for m in JOURNALISTIC_MARKERS if m in lower_text]

    # Normalized scores (0-100)
    # Sensationalism score influenced by exclamation density, all-caps, and sensational keywords
    sens_score = min(
        100.0,
        (len(sensational_found) * 20.0)
        + (min(exclamation_count, 5) * 8.0)
        + (min(uppercase_ratio, 30.0) * 1.5),
    )

    # Journalistic credibility score influenced by quotes, attribution markers
    journ_score = min(
        100.0,
        (len(journalistic_found) * 25.0)
        + (min(quote_count // 2, 4) * 10.0)
        + (15.0 if total_words > 120 else 5.0),
    )

    return {
        "char_count": total_chars,
        "word_count": total_words,
        "uppercase_ratio": uppercase_ratio,
        "exclamation_count": exclamation_count,
        "question_count": question_count,
        "quote_count": quote_count,
        "avg_word_length": avg_word_length,
        "sensationalism_score": round(sens_score, 1),
        "journalistic_score": round(journ_score, 1),
        "sensational_matches": sensational_found,
        "journalistic_matches": journalistic_found,
    }
