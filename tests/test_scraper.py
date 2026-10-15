"""
Unit tests for live article URL scraper.
"""

from unittest.mock import patch, MagicMock
import pytest
from src.scraper import extract_article_from_url


def test_extract_article_from_url_invalid_input():
    with pytest.raises(ValueError):
        extract_article_from_url("")

    with pytest.raises(ValueError):
        extract_article_from_url("not-a-valid-url")


@patch("src.scraper.requests.get")
def test_extract_article_from_url_success(mock_get):
    html_content = """
    <!DOCTYPE html>
    <html>
    <head><title>Space Telescope Discovers Exoplanet - Science News</title></head>
    <body>
        <nav><a href="/">Home</a></nav>
        <article>
            <h1>Space Telescope Discovers Exoplanet</h1>
            <p>Astronomers using the advanced space telescope have identified a new planet orbiting a distant star.</p>
            <p>The discovery represents an important milestone in exoplanetary atmospheric science according to researchers.</p>
        </article>
        <footer><p>Copyright 2026 News Corp</p></footer>
    </body>
    </html>
    """
    mock_resp = MagicMock()
    mock_resp.text = html_content
    mock_resp.raise_for_status.return_value = None
    mock_get.return_value = mock_resp

    result = extract_article_from_url("https://science.example.com/exoplanet-discovery")
    assert result["domain"] == "science.example.com"
    assert "Exoplanet" in result["title"]
    assert "Astronomers using the advanced space telescope" in result["text"]
    assert result["word_count"] > 10
