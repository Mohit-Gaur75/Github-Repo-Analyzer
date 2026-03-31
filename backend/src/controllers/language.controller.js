const { getLanguages } = require("../services/language.service");

exports.getLanguages = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch language data",
      message: error.message
    });
  }
};