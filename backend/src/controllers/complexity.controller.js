const { analyzeCodeComplexity } = require("../services/complexity.service");

exports.getComplexity = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;

    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        error: "Owner and repo parameters are required"
      });
    }

    const data = await analyzeCodeComplexity(owner, repo);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
