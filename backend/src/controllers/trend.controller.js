const { getRepoTrend } = require("../services/trend.service");
const { asyncHandler } = require("../middlewares/error.middleware");

// GET /api/trend/:owner/:repo
exports.getRepoTrend = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    return res.status(400).json({
      success: false,
      error: "Owner and repo parameters are required"
    });
  }

  const trendData = await getRepoTrend(owner, repo);

  res.json({
    success: true,
    data: trendData
  });
});
