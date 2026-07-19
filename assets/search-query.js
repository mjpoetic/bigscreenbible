(function initializeSearchQuery(global) {
  const questionStarts = /^(?:who|whom|whose|what|where|when|why|how|which)\b/i;
  const questionFrames = /^(?:can|could|did|do|does|is|are|was|were|will|would)\b/i;
  const stopWords = new Set([
    "a", "about", "an", "and", "are", "before", "bible", "can", "could", "did", "do", "does",
    "for", "from", "how", "i", "in", "is", "it", "me", "name", "of", "on", "person",
    "scripture", "tell", "that", "the", "this", "to", "verse", "was", "were", "what", "whats",
    "when", "where", "which", "who", "whom", "whose", "why", "will", "with", "would",
  ]);
  const conceptFamilies = [
    ["build", "built", "construct", "constructed", "make", "made"],
    ["boat", "ship", "vessel", "ark"],
    ["child", "children", "son", "daughter"],
    ["die", "died", "death", "killed"],
    ["father", "dad", "parent"],
    ["heal", "healed", "healing", "cure", "cured"],
    ["husband", "spouse"],
    ["king", "ruler", "monarch"],
    ["mother", "mom", "parent"],
    ["wife", "spouse"],
  ];
  const familyByTerm = new Map();
  conceptFamilies.forEach((family) => family.forEach((term) => familyByTerm.set(term, family)));
  const excludedAnswerCategories = new Set(["Bible Library", "Bible Survey"]);
  const answerOverrides = new Map([
    ["who built the ark before the flood", {
      reference: "Genesis 6:13-22",
      variants: [
        "Who built the ark?",
        "What was the name of the person who built the ark?",
        "Who made the ark?",
      ],
    }],
    ["who received the ten commandments from god on mount sinai", {
      variants: [
        "Who received the Ten Commandments?",
        "Who got the Ten Commandments?",
        "What was the name of the person who received the Ten Commandments?",
      ],
    }],
  ]);
  const supplementalAnswers = [
    {
      category: "New Testament",
      question: "What happened on the road to Damascus?",
      variants: ["What happened to Saul on the road to Damascus?", "What happened to Paul on the road to Damascus?"],
      answer: "Jesus appeared to Saul, who was blinded for three days.",
      reference: "Acts 9:3-9",
      explanation: "Saul encountered the risen Jesus and was led into Damascus without his sight.",
    },
  ];
  let cachedAnswerSource = null;
  let cachedAnswerEntries = [];

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function naturalQuestion(value) {
    const text = String(value || "").trim().replace(/[’']/g, "");
    return /\?$/.test(text) || questionStarts.test(text) || questionFrames.test(text);
  }

  function unique(values) {
    return [...new Set(values)];
  }

  function analyze(value) {
    const normalized = normalize(value);
    const isQuestion = naturalQuestion(value);
    const allTokens = normalized.split(" ").filter((token) => token.length > 1);
    if (!isQuestion) {
      return { isQuestion: false, normalized, coreTokens: allTokens, concepts: [] };
    }
    const coreTokens = allTokens.filter((token) => !stopWords.has(token));
    const effectiveTokens = coreTokens.length ? coreTokens : allTokens;
    const seenFamilies = new Set();
    const concepts = effectiveTokens.map((token) => {
      const family = familyByTerm.get(token);
      const key = family ? family.join("|") : token;
      if (seenFamilies.has(key)) return null;
      seenFamilies.add(key);
      return unique(family || [token]);
    }).filter(Boolean);
    return { isQuestion: true, normalized, coreTokens: effectiveTokens, concepts };
  }

  function levenshtein(a, b, limit = 2) {
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1) {
      const current = [i];
      let rowMinimum = current[0];
      for (let j = 1; j <= b.length; j += 1) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
        rowMinimum = Math.min(rowMinimum, current[j]);
      }
      if (rowMinimum > limit) return limit + 1;
      previous = current;
    }
    return previous[b.length];
  }

  function wordsClose(queryWord, verseWord) {
    if (queryWord === verseWord) return true;
    if (queryWord.length < 4 || verseWord.length < 4) return false;
    if (verseWord.includes(queryWord) || queryWord.includes(verseWord)) return true;
    const limit = queryWord.length > 7 ? 2 : 1;
    return levenshtein(queryWord, verseWord, limit) <= limit;
  }

  function scoreText(value, analysis) {
    if (!analysis?.isQuestion || !analysis.concepts?.length) return null;
    const words = normalize(value).split(" ").filter(Boolean);
    let exactMatches = 0;
    let fuzzyMatches = 0;
    analysis.concepts.forEach((terms) => {
      if (terms.some((term) => words.includes(term))) {
        exactMatches += 1;
      } else if (terms.some((term) => words.some((word) => wordsClose(term, word)))) {
        fuzzyMatches += 1;
      }
    });
    const matchedConcepts = exactMatches + fuzzyMatches;
    const requiredMatches = analysis.concepts.length <= 2
      ? analysis.concepts.length
      : Math.max(2, Math.ceil(analysis.concepts.length * 0.6));
    if (matchedConcepts < requiredMatches) return null;
    const coverage = matchedConcepts / analysis.concepts.length;
    return {
      score: 70 + coverage * 80 + exactMatches * 18 + fuzzyMatches * 4,
      matchType: "Question match",
    };
  }

  function conceptsOverlap(left, right) {
    return left.some((term) => right.includes(term));
  }

  function answerSimilarity(queryAnalysis, candidateAnalysis) {
    if (!queryAnalysis?.isQuestion || !candidateAnalysis?.isQuestion) return 0;
    if (queryAnalysis.normalized === candidateAnalysis.normalized) return 1;
    if (queryAnalysis.concepts.length < 2 || candidateAnalysis.concepts.length < 2) return 0;
    const matchedQuery = queryAnalysis.concepts.filter((queryConcept) => (
      candidateAnalysis.concepts.some((candidateConcept) => conceptsOverlap(queryConcept, candidateConcept))
    )).length;
    const matchedCandidate = candidateAnalysis.concepts.filter((candidateConcept) => (
      queryAnalysis.concepts.some((queryConcept) => conceptsOverlap(queryConcept, candidateConcept))
    )).length;
    const queryCoverage = matchedQuery / queryAnalysis.concepts.length;
    const candidateCoverage = matchedCandidate / candidateAnalysis.concepts.length;
    if (matchedQuery < 2 || queryCoverage < 0.75 || candidateCoverage < 0.6) return 0;
    return queryCoverage * 0.55 + candidateCoverage * 0.45;
  }

  function eligibleAnswerQuestion(item) {
    const question = String(item?.question || "").trim();
    return Boolean(
      question
      && item?.answer
      && item?.reference
      && !excludedAnswerCategories.has(item.category)
      && !/^which reference fits this clue:/i.test(question)
      && !/^at .+,\s*what answer fits this clue:/i.test(question)
    );
  }

  function verifiedAnswerEntries(items) {
    if (items === cachedAnswerSource) return cachedAnswerEntries;
    const gameAnswers = (Array.isArray(items) ? items : [])
      .filter(eligibleAnswerQuestion)
      .map((item) => {
        const override = answerOverrides.get(normalize(item.question)) || {};
        return {
          category: item.category,
          question: item.question,
          variants: override.variants || [],
          answer: override.answer || item.answer,
          reference: override.reference || item.reference,
          explanation: override.explanation || item.explanation || "",
        };
      });
    cachedAnswerSource = items;
    cachedAnswerEntries = [...supplementalAnswers, ...gameAnswers].map((entry) => ({
      ...entry,
      analyses: [entry.question, ...(entry.variants || [])].map(analyze),
    }));
    return cachedAnswerEntries;
  }

  function matchVerifiedAnswer(value, items) {
    const queryAnalysis = analyze(value);
    if (!queryAnalysis.isQuestion) return null;
    const matches = verifiedAnswerEntries(items)
      .map((entry) => {
        const confidence = Math.max(...entry.analyses.map((analysis) => answerSimilarity(queryAnalysis, analysis)));
        return { entry, confidence };
      })
      .filter((match) => match.confidence >= 0.82)
      .sort((left, right) => right.confidence - left.confidence);
    if (!matches.length) return null;
    const best = matches[0];
    if (best.confidence < 1) {
      const competing = matches.find((match) => (
        match.entry.answer !== best.entry.answer || match.entry.reference !== best.entry.reference
      ));
      if (competing && best.confidence - competing.confidence < 0.08) return null;
    }
    return {
      answer: best.entry.answer,
      reference: best.entry.reference,
      explanation: best.entry.explanation,
      question: best.entry.question,
      confidence: best.confidence,
    };
  }

  global.BigScreenBibleSearchQuery = { analyze, matchVerifiedAnswer, normalize, scoreText };
})(typeof window === "undefined" ? globalThis : window);
