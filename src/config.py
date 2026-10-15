"""
Configuration and linguistic markers for Fake News Detection.
"""

from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
APP_DIR = BASE_DIR / "app"
STATIC_DIR = APP_DIR / "static"

MODEL_FILE = MODELS_DIR / "fake_news_classifier.joblib"
METADATA_FILE = MODELS_DIR / "model_metadata.json"
SAMPLE_DATA_FILE = DATA_DIR / "sample_articles.json"

# Classification Thresholds
HIGH_CONFIDENCE_THRESHOLD = 0.80
MODERATE_CONFIDENCE_THRESHOLD = 0.60

# Linguistic & Stylometric Heuristics for Explainable AI (XAI)
SENSATIONAL_MARKERS = {
    "shocking", "bombshell", "unbelievable", "mindblowing", "you wont believe",
    "miracle cure", "secret cure", "mainstream media wont tell", "wake up",
    "hoax", "conspiracy", "exposed", "whistleblower reveals", "urgent warning",
    "banned by doctors", "they dont want you to know", "hidden truth", "devastating blow",
    "explosive leak", "smoking gun", "destroying evidence", "proof positive",
    "deep state", "rigged", "censored truth", "viral video proves", "absolute proof"
}

JOURNALISTIC_MARKERS = {
    "according to", "spokesperson said", "official statement", "peer-reviewed",
    "study published", "data indicates", "confirmed by", "investigators found",
    "in an interview with", "reported by", "press release", "department of",
    "statistical analysis", "independent audit", "verified by", "spokesperson noted",
    "reuters", "associated press", "spokesperson stated", "evidence suggests"
}

# Standard english stopwords list (self-contained, zero-dependency)
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between",
    "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do",
    "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from",
    "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd",
    "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his",
    "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't",
    "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
    "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
    "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll",
    "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the",
    "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they",
    "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
    "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're",
    "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's",
    "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
    "yourselves"
}
