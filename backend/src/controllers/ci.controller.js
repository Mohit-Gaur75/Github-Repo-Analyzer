const { getCIHealth } = require("../services/ci.service");
const { asyncHandler } = require("../middlewares/error.middleware");

exports.getCIHealth = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    return res.status(400).json({
      success: false,
      error: "Owner and repo parameters are required"
    });
  }

  const ciData = await getCIHealth(owner, repo);

  res.json({
    success: true,
    data: ciData
  });
});
