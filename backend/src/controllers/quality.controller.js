

const { getQuality } = require("../services/quality.service");

exports.getQuality = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch quality data",
      message: error.message
    });
  }
};