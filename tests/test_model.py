"""
Unit tests for model prediction and inference engine.
"""

from src.model import FakeNewsClassifier


def test_classifier_initialization():
    clf = FakeNewsClassifier()
    assert clf.is_loaded is True
    assert clf.vectorizer is not None
    assert clf.classifier is not None


def test_predict_real_news():
    clf = FakeNewsClassifier()
    article = (
        "NASA's James Webb Space Telescope detected carbon-bearing molecules on exoplanet K2-18 b, "
        "according to a peer-reviewed study published in The Astrophysical Journal Letters."
    )
    res = clf.predict(article)
    assert res["credibility_score"] > 50.0
    assert res["is_fake"] is False
    assert res["verdict"] in ["AUTHENTIC / CREDIBLE", "LEANING CREDIBLE"]
    assert "explanation" in res
    assert "stylometrics" in res


def test_predict_fake_news():
    clf = FakeNewsClassifier()
    article = (
        "SHOCKING BOMBSHELL: Whistleblower leaks secret documents proving 5G microchips are "
        "poisoning water supplies! Mainstream media is covering this up! WAKE UP and share!"
    )
    res = clf.predict(article)
    assert res["credibility_score"] < 50.0
    assert res["is_fake"] is True
    assert res["verdict"] in ["FAKE / MISINFORMATION", "QUESTIONABLE / UNVERIFIED"]
    assert len(res["explanation"]["top_deceptive_tokens"]) > 0


def test_predict_empty_input():
    clf = FakeNewsClassifier()
    res = clf.predict("")
    assert res["verdict"] == "UNKNOWN"
    assert res["credibility_score"] == 50.0
