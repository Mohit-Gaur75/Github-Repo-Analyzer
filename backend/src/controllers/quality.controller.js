

const { getQuality } = require("../services/quality.service");
const { asyncHandler } = require("../middlewares/error.middleware");

exports.getQuality = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    return res.status(400).json({
      success: false,
      error: "Owner and repo parameters are required"
    });
  }

  const qualityData = await getQuality(owner, repo);

  res.json({
    success: true,
    data: qualityData
  });
});
