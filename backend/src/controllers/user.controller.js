const { getUserProfile } = require("../services/user.service");

// GET /api/user/:username
exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: "Username parameter is required"
      });
    }

    const profileData = await getUserProfile(username);

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    const isNotFound = error.message.includes("not found") || error.message.includes("404");
    res.status(isNotFound ? 404 : 500).json({
      success: false,
      error: isNotFound ? `GitHub user or organization '${req.params.username}' not found` : "Failed to fetch user profile",
      message: error.message
    });
  }
};
