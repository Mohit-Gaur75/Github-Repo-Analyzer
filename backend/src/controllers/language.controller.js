const { getLanguages } = require("../services/language.service");
const { asyncHandler } = require("../middlewares/error.middleware");

exports.getLanguages = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    return res.status(400).json({
      success: false,
      error: "Owner and repo parameters are required"
    });
  }

  const languageData = await getLanguages(owner, repo);

  res.json({
    success: true,
    data: languageData
  });
});
