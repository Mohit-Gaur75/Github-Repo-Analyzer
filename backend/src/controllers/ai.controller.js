const { generateAIAnalysis } = require("../services/ai.service");
const { getRepoDetails, getRepoAnalysis } = require("../services/github.service");

exports.getAIInsights = async (req, res) => {
  try {
    const { owner, repo } = req.params;

    if (!owner || !repo) {
      return res.status(400).json({ success: false, error: "Owner and repo are required" });
    }

    // Fetch repo + analysis data in parallel
    const [repoData, fullAnalysis] = await Promise.all([
      getRepoDetails(owner, repo),
      getRepoAnalysis(owner, repo).catch(() => null)
    ]);

    const aiResult = await generateAIAnalysis(repoData, fullAnalysis);

    res.json({
      success: true,
      data: {
        repo: `${owner}/${repo}`,
        generatedAt: new Date().toISOString(),
        ...aiResult
      }
    });
  } catch (error) {
    const isConfig = error.message.includes("GEMINI_API_KEY");
    res.status(isConfig ? 503 : 500).json({
      success: false,
      error: isConfig
        ? "AI service not configured. Add GEMINI_API_KEY to backend .env"
        : "Failed to generate AI insights",
      message: error.message
    });
  }
};
