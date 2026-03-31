
const { getCommits } = require("../services/commit.service");

exports.getCommits = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch commit data",
      message: error.message
    });
  }
};