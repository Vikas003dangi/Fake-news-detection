/**
 * Fake News Detection System — Client-Side In-Browser NLP Inference Engine
 * Allows 100% serverless, zero-latency execution directly on GitHub Pages!
 */

(function (window) {
  'use strict';

  const NLPEngine = {
    isReady: false,
    bundle: null,
    featureMap: new Map(),

    init: function () {
      if (window.CLIENT_MODEL_BUNDLE) {
        this.bundle = window.CLIENT_MODEL_BUNDLE;
        this.bundle.features.forEach((feat, idx) => {
          this.featureMap.set(feat, idx);
        });
        this.isReady = true;
      }
    },

    cleanText: function (text) {
      if (!text || typeof text !== 'string') return '';
      // Strip HTML
      let clean = text.replace(/<[^>]+>/g, ' ');
      // Strip URLs
      clean = clean.replace(/https?:\/\/\S+|www\.\S+/g, ' ');
      // Strip emails
      clean = clean.replace(/\S+@\S+/g, ' ');
      // Handle contractions & quotes
      clean = clean.replace(/[’']/g, "'").replace(/[“”"]/g, '"');
      // Keep only alphanumerics, spaces, hyphens
      clean = clean.replace(/[^a-zA-Z0-9\s-]/g, ' ').toLowerCase();

      const stopSet = new Set(this.bundle ? this.bundle.stopwords : []);
      const words = clean.split(/\s+/).filter((w) => w.length > 1 && !stopSet.has(w));
      return words.join(' ');
    },

    extractStylometrics: function (rawText) {
      if (!rawText || typeof rawText !== 'string') {
        return {
          char_count: 0,
          word_count: 0,
          uppercase_ratio: 0,
          exclamation_count: 0,
          question_count: 0,
          quote_count: 0,
          avg_word_length: 0,
          sensationalism_score: 0,
          journalistic_score: 0,
          sensational_matches: [],
          journalistic_matches: []
        };
      }

      const totalChars = rawText.length;
      const words = rawText.trim().split(/\s+/).filter(Boolean);
      const totalWords = words.length || 1;

      let upperCount = 0;
      for (let i = 0; i < totalChars; i++) {
        const c = rawText[i];
        if (c >= 'A' && c <= 'Z') upperCount++;
      }
      const uppercaseRatio = totalChars > 0 ? Number(((upperCount / totalChars) * 100).toFixed(2)) : 0;

      const exclamationCount = (rawText.match(/!/g) || []).length;
      const questionCount = (rawText.match(/\?/g) || []).length;
      const quoteCount = (rawText.match(/["']/g) || []).length;

      const totalWordLen = words.reduce((acc, w) => acc + w.length, 0);
      const avgWordLength = Number((totalWordLen / totalWords).toFixed(2));

      const lower = rawText.toLowerCase();
      const sensMarkers = this.bundle ? this.bundle.sensational_markers : [];
      const journMarkers = this.bundle ? this.bundle.journalistic_markers : [];

      const sensFound = sensMarkers.filter((m) => lower.includes(m));
      const journFound = journMarkers.filter((m) => lower.includes(m));

      const sensScore = Math.min(
        100,
        sensFound.length * 20.0 + Math.min(exclamationCount, 5) * 8.0 + Math.min(uppercaseRatio, 30.0) * 1.5
      );

      const journScore = Math.min(
        100,
        journFound.length * 25.0 + Math.min(Math.floor(quoteCount / 2), 4) * 10.0 + (totalWords > 120 ? 15.0 : 5.0)
      );

      return {
        char_count: totalChars,
        word_count: totalWords,
        uppercase_ratio: uppercaseRatio,
        exclamation_count: exclamationCount,
        question_count: questionCount,
        quote_count: quoteCount,
        avg_word_length: avgWordLength,
        sensationalism_score: Number(sensScore.toFixed(1)),
        journalistic_score: Number(journScore.toFixed(1)),
        sensational_matches: sensFound,
        journalistic_matches: journFound
      };
    },

    predict: function (rawText) {
      if (!this.isReady) this.init();

      const stylometrics = this.extractStylometrics(rawText);
      const cleaned = this.cleanText(rawText);

      if (!cleaned || !this.isReady) {
        return {
          verdict: 'QUESTIONABLE / UNVERIFIED',
          is_fake: false,
          credibility_score: 50.0,
          fake_probability: 0.5,
          confidence_level: 'LOW',
          stylometrics: stylometrics,
          explanation: {
            top_deceptive_tokens: [],
            top_credible_tokens: [],
            annotated_html: rawText,
            explanation_summary: 'Insufficient text or model bundle loading.'
          }
        };
      }

      // Generate N-Grams (unigrams + bigrams)
      const tokens = cleaned.split(/\s+/).filter(Boolean);
      const ngrams = [];
      for (let i = 0; i < tokens.length; i++) {
        ngrams.push(tokens[i]);
        if (i < tokens.length - 1) {
          ngrams.push(tokens[i] + ' ' + tokens[i + 1]);
        }
      }

      // Calculate TF
      const tfMap = new Map();
      ngrams.forEach((ng) => {
        tfMap.set(ng, (tfMap.get(ng) || 0) + 1);
      });

      // TF-IDF with sublinear tf: (1 + ln(tf)) * idf
      const vectorWeights = new Map();
      let normSq = 0;

      tfMap.forEach((count, term) => {
        if (this.featureMap.has(term)) {
          const idx = this.featureMap.get(term);
          const idf = this.bundle.idf[idx];
          const tfVal = 1 + Math.log(count);
          const weight = tfVal * idf;
          vectorWeights.set(idx, weight);
          normSq += weight * weight;
        }
      });

      const norm = Math.sqrt(normSq) || 1.0;

      // Compute dot product with model coefficients
      let logit = this.bundle.intercept;
      const tokenScores = new Map();

      vectorWeights.forEach((weight, idx) => {
        const normalizedWeight = weight / norm;
        const coef = this.bundle.coefficients[idx];
        const contribution = normalizedWeight * coef;
        logit += contribution;

        const term = this.bundle.features[idx];
        tokenScores.set(term, coef);
      });

      // Sigmoid probability: P(Fake)
      let fakeProb = 1.0 / (1.0 + Math.exp(-logit));

      // Stylometric Heuristic Fusion
      if (stylometrics.sensationalism_score > 75.0 && fakeProb < 0.7) {
        fakeProb = Math.min(0.95, fakeProb + 0.15);
      } else if (stylometrics.journalistic_score > 70.0 && fakeProb > 0.35) {
        fakeProb = Math.max(0.05, fakeProb - 0.15);
      }

      fakeProb = Number(fakeProb.toFixed(4));
      const credibilityScore = Number(((1.0 - fakeProb) * 100).toFixed(1));

      // Verdict & Confidence
      let verdict = '';
      let isFake = false;
      let confidence = 'MODERATE';

      if (fakeProb >= 0.7) {
        verdict = 'FAKE / MISINFORMATION';
        isFake = true;
        confidence = fakeProb >= 0.85 ? 'HIGH' : 'MODERATE';
      } else if (fakeProb >= 0.5) {
        verdict = 'QUESTIONABLE / UNVERIFIED';
        isFake = true;
        confidence = fakeProb >= 0.6 ? 'MODERATE' : 'LOW';
      } else if (fakeProb >= 0.3) {
        verdict = 'LEANING CREDIBLE';
        isFake = false;
        confidence = 'MODERATE';
      } else {
        verdict = 'AUTHENTIC / CREDIBLE';
        isFake = false;
        confidence = fakeProb <= 0.15 ? 'HIGH' : 'MODERATE';
      }

      // XAI Token Attributions
      const deceptiveList = [];
      const credibleList = [];

      tokenScores.forEach((coef, term) => {
        if (coef > 0) {
          deceptiveList.push({ token: term, weight: Number(coef.toFixed(3)) });
        } else if (coef < 0) {
          credibleList.push({ token: term, weight: Number(Math.abs(coef).toFixed(3)) });
        }
      });

      deceptiveList.sort((a, b) => b.weight - a.weight);
      credibleList.sort((a, b) => b.weight - a.weight);

      // Build Annotated HTML
      const rawWords = rawText.split(/\s+/);
      const annotatedWords = rawWords.map((word) => {
        const cleanW = word.replace(/[^\w-]/g, '').toLowerCase();
        const score = tokenScores.get(cleanW) || 0;
        const isSens = this.bundle.sensational_markers.some((m) => cleanW.includes(m));

        const escaped = word.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        if (score > 0.4 || isSens) {
          return `<mark class="token-deceptive" title="Manipulative/Fake signal (+${score.toFixed(2)})">${escaped}</mark>`;
        } else if (score < -0.4) {
          return `<mark class="token-credible" title="Credibility marker (${score.toFixed(2)})">${escaped}</mark>`;
        }
        return escaped;
      });

      let summary = '';
      if (deceptiveList.length > 0 && credibleList.length === 0) {
        summary = `Article exhibits strong linguistic patterns associated with misinformation. Notable triggers: ${deceptiveList
          .slice(0, 4)
          .map((t) => `"${t.token}"`)
          .join(', ')}.`;
      } else if (credibleList.length > 0 && deceptiveList.length === 0) {
        summary = `Article displays verified journalistic attribution patterns. Key credibility markers: ${credibleList
          .slice(0, 4)
          .map((t) => `"${t.token}"`)
          .join(', ')}.`;
      } else {
        summary = `Prediction derived from calibrated feature weights: ${deceptiveList.length} deceptive signals vs ${credibleList.length} credibility indicators detected.`;
      }

      return {
        verdict: verdict,
        is_fake: isFake,
        credibility_score: credibilityScore,
        fake_probability: fakeProb,
        confidence_level: confidence,
        stylometrics: stylometrics,
        explanation: {
          top_deceptive_tokens: deceptiveList.slice(0, 8),
          top_credible_tokens: credibleList.slice(0, 8),
          annotated_html: annotatedWords.join(' '),
          explanation_summary: summary
        }
      };
    }
  };

  window.NLPEngine = NLPEngine;
})(window);
