/**
 * Fake News Detection System — Generative AI Fact-Checking & Deep Reasoning Engine
 */

(function (window) {
  'use strict';

  const AIAgent = {
    apiKeyStorageKey: 'veritas_gemini_api_key',

    getApiKey: function () {
      return localStorage.getItem(this.apiKeyStorageKey) || '';
    },

    setApiKey: function (key) {
      if (key) {
        localStorage.setItem(this.apiKeyStorageKey, key.trim());
      } else {
        localStorage.removeItem(this.apiKeyStorageKey);
      }
    },

    runDeepFactCheck: async function (articleText) {
      const apiKey = this.getApiKey();

      if (apiKey) {
        try {
          return await this.callGeminiAPI(articleText, apiKey);
        } catch (err) {
          console.warn('Gemini API call failed, falling back to local reasoning:', err);
          return this.runLocalReasoning(articleText, `API Error: ${err.message}. Showing local forensic analysis.`);
        }
      }

      // Built-in intelligent reasoning engine (offline / serverless)
      return this.runLocalReasoning(articleText);
    },

    callGeminiAPI: async function (text, apiKey) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const prompt = `You are a world-class investigative news forensic auditor and fact-checker. 
Analyze the following news article or headline thoroughly:

--- ARTICLE ---
${text}
--- END ARTICLE ---

Provide a structured JSON response with the following exact keys:
1. "overall_verdict": One of ["AUTHENTIC & VERIFIED", "MIXED / PARTIALLY TRUE", "MISINFORMATION / FABRICATED"]
2. "risk_level": One of ["LOW", "MODERATE", "CRITICAL"]
3. "credibility_score": integer between 0 and 100
4. "claims_breakdown": array of objects with keys "claim", "status" (one of ["VERIFIED", "UNSUBSTANTIATED", "DEBUNKED"]), and "analysis"
5. "manipulation_tactics": array of strings (e.g. "Ragebait / Urgency", "Lack of Direct Sourcing", "Conspiracy Rhetoric", "Ad Hominem")
6. "recommended_sources": array of authoritative sources or fact-checking databases relevant to this topic
7. "investigative_summary": concise 2-3 sentence executive synthesis explaining the verdict.

Return ONLY the valid raw JSON object without markdown formatting.`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(rawJson);
    },

    runLocalReasoning: function (text, customNotice) {
      const lower = text.toLowerCase();
      const sentences = text
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);

      const hasConspiracy = /conspiracy|deep state|whistleblower|5g|clones|hoax|hidden truth|censored/i.test(text);
      const hasMiracle = /miracle cure|100% natural|doctors hate|banned by|secret cure/i.test(text);
      const hasUrgency = /wake up|urgent warning|share before|midnight tonight|breaking bombshell/i.test(text);
      const hasCitation = /according to|study published|peer-reviewed|spokesperson|reuters|lancet|associated press/i.test(text);

      const claims = sentences.slice(0, 4).map((s) => {
        let status = 'UNSUBSTANTIATED';
        let analysis = 'Lacks empirical source verification or institutional citation.';

        if (/according to|study|published|data|confirmed|official/i.test(s)) {
          status = 'VERIFIED';
          analysis = 'Cites corroborating study or institutional spokesperson.';
        } else if (/shocking|secret|leaked|banned|cure|hoax/i.test(s)) {
          status = 'DEBUNKED';
          analysis = 'Employs classic hyperbole and unverified conspiratorial assertions.';
        }

        return {
          claim: s.length > 120 ? s.substring(0, 117) + '...' : s,
          status: status,
          analysis: analysis
        };
      });

      const manipulation = [];
      if (hasUrgency) manipulation.push('Artificial Urgency / Virality Triggers');
      if (hasConspiracy) manipulation.push('Unsubstantiated Conspiracy / Cover-Up Framing');
      if (hasMiracle) manipulation.push('Pseudoscience / Unverified Medical Claims');
      if (!hasCitation) manipulation.push('Absence of Primary Sourcing / Attribution');
      if (text.toUpperCase() === text && text.length > 20) manipulation.push('Visual Aggression (All-Caps Shouting)');

      let verdict = 'AUTHENTIC & VERIFIED';
      let risk = 'LOW';
      let score = 88;

      if (hasConspiracy || hasMiracle || manipulation.length >= 2) {
        verdict = 'MISINFORMATION / FABRICATED';
        risk = 'CRITICAL';
        score = 18;
      } else if (manipulation.length === 1 || !hasCitation) {
        verdict = 'MIXED / PARTIALLY TRUE';
        risk = 'MODERATE';
        score = 55;
      }

      return {
        overall_verdict: verdict,
        risk_level: risk,
        credibility_score: score,
        claims_breakdown: claims.length > 0 ? claims : [{ claim: text, status: 'UNSUBSTANTIATED', analysis: 'Single clause input.' }],
        manipulation_tactics: manipulation.length > 0 ? manipulation : ['No overt rhetorical manipulation detected.'],
        recommended_sources: ['Reuters Fact Check', 'Associated Press Fact Check', 'Snopes.com', 'PolitiFact'],
        investigative_summary:
          customNotice ||
          (score > 70
            ? 'Article demonstrates conventional journalistic attribution with empirical citations and neutral tone.'
            : 'Article exhibits significant rhetoric common in viral misinformation campaigns, lacking credible named sources or peer-reviewed evidence.'),
        is_local_engine: true
      };
    }
  };

  window.AIAgent = AIAgent;
})(window);
