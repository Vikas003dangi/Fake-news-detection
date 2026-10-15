/**
 * Fake News Detection System — Unified Frontend Controller
 * Supports dual-engine execution:
 * 1. In-browser Neural NLP Engine (100% serverless for GitHub Pages)
 * 2. Generative AI Deep Fact-Checker (Gemini API + local reasoning)
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const newsInput = document.getElementById('news-input');
  const btnAnalyze = document.getElementById('btn-analyze');
  const btnAnalyzeLabel = document.getElementById('btn-analyze-label');
  const btnClear = document.getElementById('btn-clear');
  const charCounter = document.getElementById('char-counter');
  const wordCounter = document.getElementById('word-counter');
  const activeEngineBadge = document.getElementById('active-engine-badge');
  const sampleChips = document.querySelectorAll('.sample-chip');

  const tabEngineNlp = document.getElementById('tab-engine-nlp');
  const tabEngineGenai = document.getElementById('tab-engine-genai');

  const resultsSection = document.getElementById('results-section');
  const verdictBanner = document.getElementById('verdict-banner');
  const gaugeFill = document.getElementById('gauge-fill');
  const gaugeScore = document.getElementById('gauge-score');
  const verdictBadge = document.getElementById('verdict-badge');
  const confidenceBadge = document.getElementById('confidence-badge');
  const verdictHeading = document.getElementById('verdict-heading');
  const verdictSummary = document.getElementById('verdict-summary');
  const btnDownloadAudit = document.getElementById('btn-download-audit');

  // GenAI Elements
  const genaiReasoningPanel = document.getElementById('genai-reasoning-panel');
  const aiEngineSourceLabel = document.getElementById('ai-engine-source-label');
  const claimsListContainer = document.getElementById('claims-list-container');
  const tacticsListContainer = document.getElementById('tactics-list-container');
  const sourcesListContainer = document.getElementById('sources-list-container');

  // NLP Elements
  const nlpAnalysisGrid = document.getElementById('nlp-analysis-grid');
  const annotatedTextBox = document.getElementById('annotated-text-box');
  const deceptiveChips = document.getElementById('deceptive-chips');
  const credibleChips = document.getElementById('credible-chips');

  const metricSensationalism = document.getElementById('metric-sensationalism');
  const barSensationalism = document.getElementById('bar-sensationalism');
  const metricJournalistic = document.getElementById('metric-journalistic');
  const barJournalistic = document.getElementById('bar-journalistic');

  const metricUppercase = document.getElementById('metric-uppercase');
  const metricExclamation = document.getElementById('metric-exclamation');
  const metricQuotes = document.getElementById('metric-quotes');
  const metricAvgWord = document.getElementById('metric-avg-word');

  // Mode & Scraper Elements
  const tabModeText = document.getElementById('tab-mode-text');
  const tabModeUrl = document.getElementById('tab-mode-url');
  const urlScraperContainer = document.getElementById('url-scraper-container');
  const newsUrlInput = document.getElementById('news-url-input');
  const btnFetchUrl = document.getElementById('btn-fetch-url');
  const btnFetchLabel = document.getElementById('btn-fetch-label');
  const urlScrapeStatus = document.getElementById('url-scrape-status');

  // Sentence Flow Elements
  const ratioCredible = document.getElementById('ratio-credible');
  const ratioQuestionable = document.getElementById('ratio-questionable');
  const ratioMisinfo = document.getElementById('ratio-misinfo');
  const flowSegCredible = document.getElementById('flow-seg-credible');
  const flowSegQuestionable = document.getElementById('flow-seg-questionable');
  const flowSegMisinfo = document.getElementById('flow-seg-misinfo');
  const sentenceListContainer = document.getElementById('sentence-list-container');

  // Modals
  const btnOpenMetrics = document.getElementById('btn-open-metrics');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const metricsModal = document.getElementById('metrics-modal');
  const modalContent = document.getElementById('modal-content');

  const btnApiKeyConfig = document.getElementById('btn-api-key-config');
  const btnCloseKeyModal = document.getElementById('btn-close-key-modal');
  const apiKeyModal = document.getElementById('api-key-modal');
  const geminiKeyInput = document.getElementById('gemini-key-input');
  const btnSaveKey = document.getElementById('btn-save-key');
  const btnClearKey = document.getElementById('btn-clear-key');

  let activeEngine = 'nlp'; // 'nlp' | 'genai'
  let lastAnalysisResult = null;
  let sampleArticlesCache = [];

  // Theme Switching Controller
  const themeBtns = document.querySelectorAll('.theme-btn');
  const savedTheme = localStorage.getItem('fake_news_theme') || 'dark';

  function applyTheme(theme) {
    document.body.classList.remove('dark-theme', 'light-theme', 'pink-theme');
    document.body.classList.add(`${theme}-theme`);
    themeBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    localStorage.setItem('fake_news_theme', theme);
  }

  themeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.theme);
    });
  });

  applyTheme(savedTheme);

  // Static fallback samples for GitHub Pages
  const DEFAULT_SAMPLES = [
    {
      id: 'real-space',
      category: 'Science & Space',
      text: "NASA's James Webb Space Telescope has detected carbon-bearing molecules, including methane and carbon dioxide, in the atmosphere of exoplanet K2-18 b, according to a peer-reviewed study published in The Astrophysical Journal Letters. Lead investigators stated that the findings provide crucial insights into habitable-zone sub-Neptune worlds."
    },
    {
      id: 'real-health',
      category: 'Medical & Clinical',
      text: "Pharmaceutical researchers at the University of Oxford have concluded Phase III clinical trials for an updated dual-strain vaccine. According to data published in The Lancet, the randomized double-blind trial demonstrated 91.4% efficacy in preventing severe respiratory complications among high-risk patients."
    },
    {
      id: 'real-economy',
      category: 'Finance & Economics',
      text: "The Federal Reserve held the benchmark interest rate steady at 5.25% to 5.50% following a two-day policy meeting. In an official press statement, Federal Reserve officials noted that economic activity has been expanding at a solid pace, though inflation remains somewhat elevated."
    },
    {
      id: 'fake-conspiracy',
      category: 'Conspiracy & Panic',
      text: "SHOCKING BOMBSHELL: Whistleblower leaks hidden documents revealing secret 5G microchips are being secretly added to municipal water supplies! Mainstream media is completely silent while millions drink poisoned water! WAKE UP and share before this video is deleted!"
    },
    {
      id: 'fake-medical',
      category: 'Health Scams',
      text: "THEY ARE LYING TO YOU! Local doctor discovers 100% natural miracle cure that wipes out all cancer tumors in 48 hours, but Big Pharma corrupt billionaires banned it to protect their multi-trillion dollar profits! Doctors hate this man!"
    },
    {
      id: 'fake-finance',
      category: 'Financial Scams',
      text: "URGENT WARNING: Secret government agency signs executive order to seize all private gold, bank deposits, and retirement 401ks by midnight tonight! Insider reveals deep state plot to collapse the dollar and force mandatory digital currency slavery!"
    }
  ];

  // Initialize in-browser NLP Engine
  if (window.NLPEngine) {
    window.NLPEngine.init();
  }

  // Load Preset Samples
  async function loadPresetSamples() {
    try {
      const res = await fetch('./sample_articles.json');
      if (res.ok) {
        sampleArticlesCache = await res.json();
      } else {
        sampleArticlesCache = DEFAULT_SAMPLES;
      }
    } catch {
      sampleArticlesCache = DEFAULT_SAMPLES;
    }
  }

  // Update Counters
  function updateCounters() {
    const text = newsInput.value || '';
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    charCounter.textContent = `${chars} chars`;
    wordCounter.textContent = `${words} words`;
  }

  newsInput.addEventListener('input', updateCounters);

  // Clear Input
  btnClear.addEventListener('click', () => {
    newsInput.value = '';
    updateCounters();
    resultsSection.classList.add('hidden');
    if (urlScrapeStatus) urlScrapeStatus.classList.add('hidden');
    newsInput.focus();
  });

  // Switch Input Mode Tabs (Text vs Live URL Scraper)
  if (tabModeText && tabModeUrl) {
    tabModeText.addEventListener('click', () => {
      tabModeText.classList.add('active');
      tabModeUrl.classList.remove('active');
      if (urlScraperContainer) urlScraperContainer.classList.add('hidden');
      newsInput.focus();
    });

    tabModeUrl.addEventListener('click', () => {
      tabModeUrl.classList.add('active');
      tabModeText.classList.remove('active');
      if (urlScraperContainer) urlScraperContainer.classList.remove('hidden');
      if (newsUrlInput) newsUrlInput.focus();
    });
  }

  // URL Scraper Handler
  async function handleUrlScrape() {
    let rawUrl = (newsUrlInput ? newsUrlInput.value : '').trim();
    if (!rawUrl) {
      alert('Please enter or paste a valid article URL.');
      return;
    }
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = 'https://' + rawUrl;
      if (newsUrlInput) newsUrlInput.value = rawUrl;
    }

    let parsedDomain = 'news source';
    try {
      parsedDomain = new URL(rawUrl).hostname;
    } catch {
      parsedDomain = rawUrl;
    }

    if (urlScrapeStatus) {
      urlScrapeStatus.className = 'url-scrape-status status-loading';
      urlScrapeStatus.innerHTML = `Extracting article content from <em>${escapeHtml(parsedDomain)}</em>...`;
      urlScrapeStatus.classList.remove('hidden');
    }
    if (btnFetchUrl) btnFetchUrl.disabled = true;
    if (btnFetchLabel) btnFetchLabel.textContent = 'Extracting...';

    let extractedText = '';
    let domain = parsedDomain;

    try {
      // Step 1: Try local backend /api/scrape-url if available
      try {
        const res = await fetch('/api/scrape-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl })
        });
        if (res.ok) {
          const data = await res.json();
          extractedText = data.text;
          domain = data.domain || domain;
        }
      } catch (e) {
        // Backend not running (e.g. running on GitHub Pages)
      }

      // Step 2: Fallback to Jina Reader CORS-friendly universal extractor for GitHub Pages
      if (!extractedText) {
        const jinaUrl = `https://r.jina.ai/${rawUrl}`;
        const res = await fetch(jinaUrl, {
          headers: {
            Accept: 'text/plain'
          }
        });
        if (res.ok) {
          const rawDoc = await res.text();
          let cleanDoc = rawDoc.replace(/!\[.*?\]\(.*?\)/g, ''); // strip markdown images
          cleanDoc = cleanDoc.replace(/\[(.*?)\]\(.*?\)/g, '$1'); // markdown links
          cleanDoc = cleanDoc.replace(/https?:\/\/\S+/g, ''); // urls
          cleanDoc = cleanDoc.replace(/^(\s*[-*#=_]\s*){3,}$/gm, ''); // rules
          extractedText = cleanDoc.trim();
        } else {
          throw new Error(`HTTP ${res.status} from web reader.`);
        }
      }

      if (!extractedText || extractedText.length < 40) {
        throw new Error('Could not extract meaningful article text from this URL.');
      }

      newsInput.value = extractedText;
      updateCounters();

      if (urlScrapeStatus) {
        urlScrapeStatus.className = 'url-scrape-status status-success';
        const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
        urlScrapeStatus.innerHTML = `✅ Successfully extracted <strong>${wordCount} words</strong> from <em>${escapeHtml(domain)}</em>`;
      }

      // Automatically execute analysis
      await executeAnalysis();
    } catch (err) {
      if (urlScrapeStatus) {
        urlScrapeStatus.className = 'url-scrape-status status-error';
        urlScrapeStatus.innerHTML = `⚠️ Extraction error: ${escapeHtml(err.message || 'Check the URL or paste text directly.')}`;
      }
    } finally {
      if (btnFetchUrl) btnFetchUrl.disabled = false;
      if (btnFetchLabel) btnFetchLabel.textContent = 'Fetch & Extract';
    }
  }

  if (btnFetchUrl) {
    btnFetchUrl.addEventListener('click', handleUrlScrape);
  }
  if (newsUrlInput) {
    newsUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleUrlScrape();
      }
    });
  }

  // Switch Engine Tabs
  tabEngineNlp.addEventListener('click', () => {
    activeEngine = 'nlp';
    tabEngineNlp.classList.add('active');
    tabEngineGenai.classList.remove('active');
    activeEngineBadge.textContent = 'Engine: Neural Fast Forensics';
    btnAnalyzeLabel.textContent = 'Analyze Credibility';
    genaiReasoningPanel.classList.add('hidden');
  });

  tabEngineGenai.addEventListener('click', () => {
    activeEngine = 'genai';
    tabEngineGenai.classList.add('active');
    tabEngineNlp.classList.remove('active');
    activeEngineBadge.textContent = 'Engine: Generative AI Reasoning';
    btnAnalyzeLabel.textContent = 'Run AI Fact-Check';
  });

  // Handle Preset Sample Clicks
  sampleChips.forEach((chip) => {
    chip.addEventListener('click', async () => {
      const sampleId = chip.dataset.sample;
      if (sampleArticlesCache.length === 0) await loadPresetSamples();

      const matched = sampleArticlesCache.find((s) => s.id === sampleId);
      if (matched) {
        newsInput.value = matched.text;
        updateCounters();
        await executeAnalysis();
      }
    });
  });

  // Execute Analysis
  async function executeAnalysis() {
    const text = newsInput.value.trim();
    if (text.length < 5) {
      alert('Please enter at least 5 characters to analyze.');
      newsInput.focus();
      return;
    }

    // Loading State
    const originalBtnHtml = btnAnalyze.innerHTML;
    btnAnalyze.disabled = true;
    btnAnalyze.innerHTML = `
      <span class="pulse-dot"></span>
      <span class="btn-label">${activeEngine === 'genai' ? 'Fact-Checking...' : 'Evaluating...'}</span>
    `;

    try {
      // 1. Run NLP Forensics (always available via in-browser engine or API)
      let nlpData = null;
      if (window.NLPEngine && window.NLPEngine.isReady) {
        nlpData = window.NLPEngine.predict(text);
      } else {
        // Fallback to API if server is running
        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        if (res.ok) nlpData = await res.json();
      }

      // 2. If Generative AI mode is active, run Deep Fact-Check
      let genaiData = null;
      if (activeEngine === 'genai' && window.AIAgent) {
        genaiData = await window.AIAgent.runDeepFactCheck(text);
      }

      lastAnalysisResult = { text, nlpData, genaiData, engine: activeEngine };
      renderResults(nlpData, genaiData);
    } catch (err) {
      alert(`Analysis error: ${err.message}`);
    } finally {
      btnAnalyze.disabled = false;
      btnAnalyze.innerHTML = originalBtnHtml;
    }
  }

  btnAnalyze.addEventListener('click', executeAnalysis);

  // Render Analysis Results
  function renderResults(nlpData, genaiData) {
    resultsSection.classList.remove('hidden');

    const score = genaiData ? genaiData.credibility_score : nlpData.credibility_score;
    const isFake = genaiData ? genaiData.risk_level === 'CRITICAL' : nlpData.is_fake;
    const verdict = genaiData ? genaiData.overall_verdict : nlpData.verdict;

    // Radial Gauge Animation
    const circumference = 314.15;
    const offset = circumference - (score / 100) * circumference;
    gaugeFill.style.strokeDashoffset = offset;
    gaugeScore.textContent = Math.round(score);

    verdictBanner.className = 'verdict-banner glass-card';
    verdictBadge.className = 'verdict-pill';

    if (score >= 65) {
      gaugeFill.style.stroke = 'var(--color-credible)';
      verdictBanner.classList.add('verdict-real');
      verdictBadge.classList.add('pill-real');
      verdictHeading.textContent = 'High Probable Authenticity';
    } else if (score >= 45) {
      gaugeFill.style.stroke = 'var(--color-warning)';
      verdictBanner.classList.add('verdict-warning');
      verdictBadge.classList.add('pill-warning');
      verdictHeading.textContent = 'Questionable / Mixed Signals';
    } else {
      gaugeFill.style.stroke = 'var(--color-fake)';
      verdictBanner.classList.add('verdict-fake');
      verdictBadge.classList.add('pill-fake');
      verdictHeading.textContent = 'High Misinformation Risk';
    }

    verdictBadge.textContent = verdict;
    confidenceBadge.textContent = genaiData
      ? `AI Risk: ${genaiData.risk_level}`
      : `Confidence: ${nlpData.confidence_level} (${Math.round((1 - Math.abs(0.5 - nlpData.fake_probability) * 0.5) * 100)}%)`;

    verdictSummary.textContent = genaiData
      ? genaiData.investigative_summary
      : nlpData.explanation.explanation_summary;

    // Render GenAI Panel if GenAI data exists
    if (genaiData) {
      genaiReasoningPanel.classList.remove('hidden');
      aiEngineSourceLabel.textContent = genaiData.is_local_engine ? 'In-Browser Forensic Reasoning' : 'Google Gemini 1.5 Flash';

      // Claims
      claimsListContainer.innerHTML = '';
      genaiData.claims_breakdown.forEach((c) => {
        const item = document.createElement('div');
        item.className = 'claim-item';
        let statusClass = 'status-unsubstantiated';
        if (c.status === 'VERIFIED') statusClass = 'status-verified';
        if (c.status === 'DEBUNKED') statusClass = 'status-debunked';

        item.innerHTML = `
          <div class="claim-header">
            <span class="claim-text">"${escapeHtml(c.claim)}"</span>
            <span class="claim-status ${statusClass}">${c.status}</span>
          </div>
          <p class="claim-analysis">${escapeHtml(c.analysis)}</p>
        `;
        claimsListContainer.appendChild(item);
      });

      // Tactics
      tacticsListContainer.innerHTML = '';
      genaiData.manipulation_tactics.forEach((t) => {
        const span = document.createElement('span');
        span.className = 'tactic-tag';
        span.textContent = t;
        tacticsListContainer.appendChild(span);
      });

      // Sources
      sourcesListContainer.innerHTML = '';
      genaiData.recommended_sources.forEach((s) => {
        const span = document.createElement('span');
        span.className = 'source-tag';
        span.textContent = s;
        sourcesListContainer.appendChild(span);
      });
    } else {
      genaiReasoningPanel.classList.add('hidden');
    }

    // Render NLP XAI & Stylometrics
    if (nlpData) {
      annotatedTextBox.innerHTML = nlpData.explanation.annotated_html || '<p>No text annotated.</p>';

      deceptiveChips.innerHTML = '';
      const deceptive = nlpData.explanation.top_deceptive_tokens || [];
      if (deceptive.length === 0) {
        deceptiveChips.innerHTML = '<span class="empty-chip">No significant triggers</span>';
      } else {
        deceptive.forEach((item) => {
          const badge = document.createElement('span');
          badge.className = 'token-badge badge-deceptive';
          badge.innerHTML = `${item.token} <strong>+${item.weight.toFixed(2)}</strong>`;
          deceptiveChips.appendChild(badge);
        });
      }

      credibleChips.innerHTML = '';
      const credible = nlpData.explanation.top_credible_tokens || [];
      if (credible.length === 0) {
        credibleChips.innerHTML = '<span class="empty-chip">No journalistic markers</span>';
      } else {
        credible.forEach((item) => {
          const badge = document.createElement('span');
          badge.className = 'token-badge badge-credible';
          badge.innerHTML = `${item.token} <strong>-${item.weight.toFixed(2)}</strong>`;
          credibleChips.appendChild(badge);
        });
      }

      const s = nlpData.stylometrics;
      metricSensationalism.textContent = `${s.sensationalism_score}%`;
      barSensationalism.style.width = `${Math.min(100, s.sensationalism_score)}%`;

      metricJournalistic.textContent = `${s.journalistic_score}%`;
      barJournalistic.style.width = `${Math.min(100, s.journalistic_score)}%`;

      metricUppercase.textContent = `${s.uppercase_ratio}%`;
      metricExclamation.textContent = s.exclamation_count;
      metricQuotes.textContent = s.quote_count;
      metricAvgWord.textContent = s.avg_word_length;

      // Render Sentence-Level Credibility Flow & Heatmap
      if (nlpData.sentence_analysis && ratioCredible && sentenceListContainer) {
        const sa = nlpData.sentence_analysis;
        ratioCredible.textContent = `${sa.credible_ratio}% Credible`;
        ratioQuestionable.textContent = `${sa.questionable_ratio}% Questionable`;
        ratioMisinfo.textContent = `${sa.misinformation_ratio}% High-Risk`;

        if (flowSegCredible) flowSegCredible.style.width = `${sa.credible_ratio}%`;
        if (flowSegQuestionable) flowSegQuestionable.style.width = `${sa.questionable_ratio}%`;
        if (flowSegMisinfo) flowSegMisinfo.style.width = `${sa.misinformation_ratio}%`;

        sentenceListContainer.innerHTML = '';
        if (sa.sentences && sa.sentences.length > 0) {
          sa.sentences.forEach((sent) => {
            const item = document.createElement('div');
            let statusClass = 'status-questionable';
            let pillClass = 'score-questionable';
            if (sent.status === 'CREDIBLE') {
              statusClass = 'status-credible';
              pillClass = 'score-credible';
            } else if (sent.status === 'MISINFORMATION') {
              statusClass = 'status-misinfo';
              pillClass = 'score-misinfo';
            }

            item.className = `sentence-item ${statusClass}`;

            let tagsHtml = '';
            if (sent.sensational_triggers && sent.sensational_triggers.length > 0) {
              sent.sensational_triggers.forEach((t) => {
                tagsHtml += `<span class="sentence-tag tag-danger">⚠️ ${escapeHtml(t)}</span>`;
              });
            }
            if (sent.journalistic_markers && sent.journalistic_markers.length > 0) {
              sent.journalistic_markers.forEach((m) => {
                tagsHtml += `<span class="sentence-tag tag-success">✓ ${escapeHtml(m)}</span>`;
              });
            }

            item.innerHTML = `
              <div class="sentence-item-header">
                <span class="sentence-num">[#${sent.index}]</span>
                <span class="sentence-score-pill ${pillClass}">${sent.credibility_score}% ${sent.status}</span>
              </div>
              <p class="sentence-text">${escapeHtml(sent.text)}</p>
              ${tagsHtml ? `<div class="sentence-tags">${tagsHtml}</div>` : ''}
            `;
            sentenceListContainer.appendChild(item);
          });
        } else {
          sentenceListContainer.innerHTML = '<p class="placeholder-text">No sentence boundaries identified.</p>';
        }
      }
    }

    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Export Credibility Audit Report
  btnDownloadAudit.addEventListener('click', () => {
    if (!lastAnalysisResult) return;
    const { text, nlpData, genaiData } = lastAnalysisResult;
    const score = genaiData ? genaiData.credibility_score : nlpData.credibility_score;
    const verdict = genaiData ? genaiData.overall_verdict : nlpData.verdict;

    let report = `========================================================================\n`;
    report += `          FAKE NEWS DETECTION SYSTEM — CREDIBILITY FORENSIC AUDIT       \n`;
    report += `========================================================================\n\n`;
    report += `Date: ${new Date().toUTCString()}\n`;
    report += `Platform: Fake News Detection System (Vikas Dangi)\n`;
    report += `Overall Verdict: ${verdict}\n`;
    report += `Credibility Score: ${score} / 100\n\n`;
    report += `--- ARTICLE EXCERPT ---\n${text}\n\n`;

    if (nlpData) {
      report += `--- STYLOMETRIC FORENSICS ---\n`;
      report += `• Word Count: ${nlpData.stylometrics.word_count}\n`;
      report += `• Uppercase Ratio: ${nlpData.stylometrics.uppercase_ratio}%\n`;
      report += `• Sensationalism Score: ${nlpData.stylometrics.sensationalism_score}%\n`;
      report += `• Journalistic Score: ${nlpData.stylometrics.journalistic_score}%\n\n`;

      if (nlpData.sentence_analysis && nlpData.sentence_analysis.sentences) {
        const sa = nlpData.sentence_analysis;
        report += `--- SENTENCE-LEVEL CREDIBILITY FLOW ---\n`;
        report += `• Total Sentences: ${sa.sentence_count}\n`;
        report += `• Credible Ratio: ${sa.credible_ratio}%\n`;
        report += `• Questionable Ratio: ${sa.questionable_ratio}%\n`;
        report += `• High-Risk Ratio: ${sa.misinformation_ratio}%\n\n`;
        sa.sentences.forEach((sent) => {
          report += `  [#${sent.index}] (${sent.status} - ${sent.credibility_score}%) ${sent.text}\n`;
        });
        report += `\n`;
      }
    }

    if (genaiData) {
      report += `--- GENERATIVE AI FACT-CHECK ---\n`;
      report += `Summary: ${genaiData.investigative_summary}\n\n`;
      report += `Claims Analysis:\n`;
      genaiData.claims_breakdown.forEach((c, idx) => {
        report += `  ${idx + 1}. [${c.status}] "${c.claim}"\n     -> ${c.analysis}\n`;
      });
      report += `\nRecommended Verification Sources: ${genaiData.recommended_sources.join(', ')}\n`;
    }

    report += `\n========================================================================\n`;
    report += `Generated by https://github.com/Vikas003dangi/Fake-news-detection\n`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credibility_audit_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // API Key Modal Handlers
  btnApiKeyConfig.addEventListener('click', () => {
    apiKeyModal.classList.remove('hidden');
    geminiKeyInput.value = window.AIAgent ? window.AIAgent.getApiKey() : '';
  });

  btnCloseKeyModal.addEventListener('click', () => {
    apiKeyModal.classList.add('hidden');
  });

  btnSaveKey.addEventListener('click', () => {
    if (window.AIAgent) {
      window.AIAgent.setApiKey(geminiKeyInput.value);
    }
    apiKeyModal.classList.add('hidden');
    alert('Gemini API key saved in browser storage.');
  });

  btnClearKey.addEventListener('click', () => {
    if (window.AIAgent) {
      window.AIAgent.setApiKey('');
    }
    geminiKeyInput.value = '';
    apiKeyModal.classList.add('hidden');
    alert('Gemini API key removed.');
  });

  // Benchmark Modal Handlers
  btnOpenMetrics.addEventListener('click', async () => {
    metricsModal.classList.remove('hidden');
    modalContent.innerHTML = '<div class="loading-state">Loading model telemetry...</div>';

    try {
      let data = null;
      const res = await fetch('./model_metadata.json');
      if (res.ok) data = await res.json();
      if (!data) {
        const resApi = await fetch('/api/metrics');
        if (resApi.ok) data = await resApi.json();
      }

      if (!data) throw new Error('Benchmark telemetry not found.');

      let tableRows = '';
      if (data.benchmark_comparison) {
        for (const [mName, m] of Object.entries(data.benchmark_comparison)) {
          tableRows += `
            <tr>
              <td><strong>${mName}</strong></td>
              <td>${(m.accuracy * 100).toFixed(1)}%</td>
              <td>${(m.precision * 100).toFixed(1)}%</td>
              <td>${(m.recall * 100).toFixed(1)}%</td>
              <td>${(m.f1 * 100).toFixed(1)}%</td>
              <td>${(m.cv_f1_mean * 100).toFixed(1)}% ± ${(m.cv_f1_std * 100).toFixed(1)}%</td>
            </tr>
          `;
        }
      }

      modalContent.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <h4 style="font-size: 0.95rem; margin-bottom: 6px; color: var(--text-main);">Model Architecture</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); font-family: var(--font-mono);">
              ${data.model_architecture || 'TF-IDF (1, 2) + Calibrated Linear Classifiers'}
            </p>
            <p style="font-size: 0.78rem; color: var(--text-dim); margin-top: 4px;">
              Vocabulary: ${data.vocabulary_size} features | Evaluated: ${data.timestamp || 'Recent'}
            </p>
          </div>

          <div>
            <h4 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--text-main);">Classifier Benchmark Comparison</h4>
            <table class="benchmark-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-Score</th>
                  <th>3-Fold CV F1</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </div>
      `;
    } catch (e) {
      modalContent.innerHTML = `<div style="color: var(--color-fake);">Error loading metrics: ${e.message}</div>`;
    }
  });

  btnCloseModal.addEventListener('click', () => {
    metricsModal.classList.add('hidden');
  });

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Initial load
  loadPresetSamples();
  updateCounters();
});
