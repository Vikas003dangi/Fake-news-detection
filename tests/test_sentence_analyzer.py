"""
Unit tests for sentence-level credibility and flow analyzer.
"""

from src.sentence_analyzer import analyze_sentence_flow
from src.model import FakeNewsClassifier


def test_analyze_sentence_flow_handles_empty():
    result = analyze_sentence_flow("", None)
    assert result["sentence_count"] == 0
    assert result["sentences"] == []
    assert result["credible_ratio"] == 0.0


def test_analyze_sentence_flow_multi_sentence():
    text = (
        "According to a peer-reviewed study in The Lancet, clinical trials showed high efficacy. "
        "SHOCKING BOMBSHELL: Secret 5G towers are poisoning the water supply wake up! "
        "The Federal Reserve announced an interest rate decision on Wednesday."
    )
    classifier = FakeNewsClassifier()
    result = analyze_sentence_flow(text, classifier)

    assert result["sentence_count"] >= 3
    assert len(result["sentences"]) >= 3
    assert 0 <= result["credible_ratio"] <= 100
    assert 0 <= result["questionable_ratio"] <= 100
    assert 0 <= result["misinformation_ratio"] <= 100

    # Ensure each sentence has expected fields
    s1 = result["sentences"][0]
    assert "index" in s1
    assert "text" in s1
    assert "credibility_score" in s1
    assert "status" in s1
