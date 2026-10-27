const { getIssues } = require("../services/issue.service");
const { asyncHandler } = require("../middlewares/error.middleware");

exports.getIssues = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    return res.status(400).json({
      success: false,
      error: "Owner and repo parameters are required"
    });
  }

  const issueData = await getIssues(owner, repo);

  res.json({
    success: true,
    data: issueData
  });
});
