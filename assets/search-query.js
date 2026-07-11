(function initializeSearchQuery(global) {
  const questionStarts = /^(?:who|whom|whose|what|where|when|why|how|which)\b/i;
  const questionFrames = /^(?:can|could|did|do|does|is|are|was|were|will|would)\b/i;
  const stopWords = new Set([
    "a", "about", "an", "and", "are", "bible", "can", "could", "did", "do", "does",
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

  global.BigScreenBibleSearchQuery = { analyze, normalize, scoreText };
})(typeof window === "undefined" ? globalThis : window);
