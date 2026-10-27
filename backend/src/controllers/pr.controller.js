

const { getPullRequests } = require("../services/pr.service");
const { asyncHandler } = require("../middlewares/error.middleware");

exports.getPullRequests = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    return res.status(400).json({
      success: false,
      error: "Owner and repo parameters are required"
    });
  }

  const prData = await getPullRequests(owner, repo);

  res.json({
    success: true,
    data: prData
  });
});
