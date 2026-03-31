const estimateLOC = (languages) => {
  if (!languages || typeof languages !== "object") {
    return { total: 0, byLanguage: {} };
  }

  const BYTES_PER_LINE = {
    JavaScript: 30,
    TypeScript: 32,
    Python: 28,
    Java: 35,
    "C++": 33,
    C: 30,
    "C#": 35,
    Ruby: 25,
    Go: 30,
    Rust: 32,
    PHP: 28,
    Swift: 30,
    Kotlin: 30,
    HTML: 40,
    CSS: 25,
    SCSS: 25,
    Shell: 20,
    default: 30
  };

  const byLanguage = {};
  let total = 0;

  for (const [lang, bytes] of Object.entries(languages)) {
    const bytesPerLine = BYTES_PER_LINE[lang] || BYTES_PER_LINE.default;
    const estimatedLines = Math.floor(bytes / bytesPerLine);
    byLanguage[lang] = estimatedLines;
    total += estimatedLines;
  }

  return { total, byLanguage };
};

const formatLOC = (loc) => {
  if (loc >= 1000000) {
    return `${(loc / 1000000).toFixed(1)}M`;
  }
  if (loc >= 1000) {
    return `${(loc / 1000).toFixed(1)}K`;
  }
  return loc.toString();
};

module.exports = { estimateLOC, formatLOC };