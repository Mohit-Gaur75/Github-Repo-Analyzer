const { getReleaseIntelligence } = require("../services/release.service");
const { asyncHandler } = require("../middlewares/error.middleware");

// GET /api/releases/:owner/:repo
exports.getReleases = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    return res.status(400).json({
      success: false,
      error: "Owner and repo parameters are required"
    });
  }

  const releaseData = await getReleaseIntelligence(owner, repo);

  res.json({
    success: true,
    data: releaseData
  });
});
