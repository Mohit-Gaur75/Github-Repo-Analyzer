const { detectTechStack } = require("../services/techstack.service");
const { asyncHandler } = require("../middlewares/error.middleware");

// GET /api/techstack/:owner/:repo
exports.getTechStack = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    return res.status(400).json({
      success: false,
      error: "Owner and repo parameters are required"
    });
  }

  const stackData = await detectTechStack(owner, repo);

  res.json({
    success: true,
    data: stackData
  });
});
