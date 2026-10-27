const { getContributors } = require("../services/contributor.service");
const { asyncHandler } = require("../middlewares/error.middleware");

exports.getContributors = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    return res.status(400).json({
      success: false,
      error: "Owner and repo parameters are required"
    });
  }

  const contributorData = await getContributors(owner, repo);

  res.json({
    success: true,
    data: contributorData
  });
});
