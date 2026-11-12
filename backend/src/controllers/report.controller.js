const { generateExecutiveReport } = require("../services/report.service");
const { asyncHandler } = require("../middlewares/error.middleware");

// GET /api/report/:owner/:repo
exports.getExecutiveReport = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    return res.status(400).json({
      success: false,
      error: "Owner and repo parameters are required"
    });
  }

  const report = await generateExecutiveReport(owner, repo);

  res.json({
    success: true,
    data: report
  });
});
