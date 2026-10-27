
const { getCommits } = require("../services/commit.service");
const { asyncHandler } = require("../middlewares/error.middleware");

exports.getCommits = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    return res.status(400).json({
      success: false,
      error: "Owner and repo parameters are required"
    });
  }

  const commitData = await getCommits(owner, repo);

  res.json({
    success: true,
    data: commitData
  });
});
