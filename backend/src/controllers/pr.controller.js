

const { getPullRequests } = require("../services/pr.service");

exports.getPullRequests = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch pull request data",
      message: error.message
    });
  }
};