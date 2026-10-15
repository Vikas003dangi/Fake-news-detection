"""
Unit tests for text preprocessing and stylometric telemetry.
"""

from src.preprocessor import clean_text, extract_stylometric_features


def test_clean_text_removes_html_and_urls():
    raw = "<p>Check this link: https://example.com/breaking-news! Incredible facts.</p>"
    cleaned = clean_text(raw, remove_stopwords=False)
    assert "<p>" not in cleaned
    assert "https" not in cleaned
    assert "example" not in cleaned
    assert "incredible" in cleaned


def test_clean_text_handles_empty():
    assert clean_text("") == ""
    assert clean_text(None) == ""


def test_extract_stylometric_features_handles_all_caps_and_exclamations():
    raw = "SHOCKING BOMBSHELL: YOU WON'T BELIEVE THIS MIRACLE CURE!!!"
    stats = extract_stylometric_features(raw)
    assert stats["exclamation_count"] == 3
    assert stats["uppercase_ratio"] > 50.0
    assert stats["sensationalism_score"] > 50.0
    assert "miracle cure" in stats["sensational_matches"] or "shocking" in stats["sensational_matches"]


def test_extract_stylometric_features_detects_journalistic_attribution():
    raw = 'According to a study published in The Lancet, lead investigators confirmed data.'
    stats = extract_stylometric_features(raw)
    assert stats["journalistic_score"] > 20.0
    assert "study published" in stats["journalistic_matches"] or "according to" in stats["journalistic_matches"]
