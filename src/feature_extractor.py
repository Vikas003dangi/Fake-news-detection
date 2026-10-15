"""
Feature extraction pipeline combining TF-IDF N-grams with lexical representations.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from typing import Tuple, List, Optional
import numpy as np


def build_vectorizer(
    max_features: int = 10000,
    ngram_range: Tuple[int, int] = (1, 2),
    min_df: int = 2,
) -> TfidfVectorizer:
    """
    Constructs a TF-IDF vectorizer configured for news misinformation detection.
    Uses sublinear TF scaling to dampen the effect of repetitive keywords.
    """
    return TfidfVectorizer(
        max_features=max_features,
        ngram_range=ngram_range,
        min_df=min_df,
        sublinear_tf=True,
        norm="l2",
    )
