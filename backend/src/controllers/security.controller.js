

const { getSecurity } = require("../services/security.service");

exports.getSecurity = async (req, res) => {
  try {
    const { owner, repo } = req.params;

    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        error: "Owner and repo parameters are required"
      });
    }

    const securityData = await getSecurity(owner, repo);

    res.json({
      success: true,
      data: securityData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch security data",
      message: error.message
    });
  }
};