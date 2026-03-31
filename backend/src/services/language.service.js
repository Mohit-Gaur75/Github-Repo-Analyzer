const { githubRequest } = require("../utils/githubApi");
const { estimateLOC, formatLOC } = require("../utils/locCalculator");

exports.getLanguages = async (owner, repo) => {
  try {
    const languages = await githubRequest(
      `/repos/${owner}/${repo}/languages`
    );

    const totalBytes = Object.values(languages).reduce(
      (sum, bytes) => sum + bytes,
      0
    );

    const locData = estimateLOC(languages);

    const languageStats = Object.entries(languages).map(([lang, bytes]) => ({
      name: lang,
      bytes,
      percentage: totalBytes > 0
        ? parseFloat(((bytes / totalBytes) * 100).toFixed(2))
        : 0,
      estimatedLOC: locData.byLanguage[lang] || 0,
      formattedLOC: formatLOC(locData.byLanguage[lang] || 0)
    }));

    languageStats.sort((a, b) => b.bytes - a.bytes);

    return {
      languages: languageStats,
      totalBytes,
      totalLOC: locData.total,
      formattedTotalLOC: formatLOC(locData.total),
      primaryLanguage: languageStats[0]?.name || null,
      languageCount: languageStats.length
    };
  } catch (error) {
    throw new Error(`Failed to fetch languages: ${error.message}`);
  }
};