"""
Web Scraper and Clean Article Extractor for Live News Verification.
"""

import re
from typing import Dict, Any, Optional
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


def extract_article_from_url(url: str, timeout: int = 10) -> Dict[str, Any]:
    """
    Fetches a live news URL, strips HTML boilerplate, scripts, ads, and navigation,
    and returns extracted article headline, body text, and domain metadata.
    """
    if not url or not isinstance(url, str):
        raise ValueError("Invalid URL provided.")

    parsed = urlparse(url.strip())
    if not parsed.scheme or not parsed.netloc:
        raise ValueError("URL must include http:// or https:// scheme.")

    domain = parsed.netloc

    try:
        response = requests.get(url, headers=HEADERS, timeout=timeout)
        response.raise_for_status()
    except requests.RequestException as e:
        raise RuntimeError(f"Failed to fetch content from {domain}: {str(e)}")

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove non-content tags
    for tag in soup(["script", "style", "nav", "header", "footer", "aside", "form", "svg"]):
        tag.decompose()

    # Extract Title
    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()
    elif soup.find("h1"):
        title = soup.find("h1").get_text(strip=True)

    # Extract Body Paragraphs
    paragraphs = []
    # Target article tag first if present
    article_tag = soup.find("article") or soup.find("main") or soup
    for p in article_tag.find_all("p"):
        text = p.get_text(strip=True)
        # Filter out short menu or copyright fragments
        if len(text) > 35:
            paragraphs.append(text)

    body_text = "\n\n".join(paragraphs)
    if not body_text:
        # Fallback to general text
        body_text = soup.get_text(separator=" ", strip=True)
        # Normalize excessive whitespace
        body_text = re.sub(r"\s+", " ", body_text)

    # Limit to reasonable length
    clean_article = f"{title}\n\n{body_text}".strip()
    words = clean_article.split()

    return {
        "title": title,
        "text": clean_article[:25000],
        "word_count": len(words),
        "domain": domain,
        "url": url,
    }
