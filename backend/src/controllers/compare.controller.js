const { compareRepositories } = require("../services/compare.service");

// GET /api/compare/:owner1/:repo1/:owner2/:repo2
exports.compareRepos = async (req, res) => {
  try {
    const { owner1, repo1, owner2, repo2 } = req.params;

    if (!owner1 || !repo1 || !owner2 || !repo2) {
      return res.status(400).json({
        success: false,
        error: "Both repositories (owner1/repo1 and owner2/repo2) are required"
      });
    }

    const comparison = await compareRepositories(owner1, repo1, owner2, repo2);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to compare repositories",
      message: error.message
    });
  }
};
