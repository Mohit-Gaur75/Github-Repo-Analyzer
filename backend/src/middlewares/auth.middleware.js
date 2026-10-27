const validateRequest = (req, res, next) => {
  const { owner, repo } = req.params;

  if (owner && repo) {
    const validPattern = /^[a-zA-Z0-9_.-]+$/;

    if (!validPattern.test(owner) || !validPattern.test(repo)) {
      return res.status(400).json({
        success: false,
        error: "Invalid repository owner or name format"
      });
    }

    if (owner.length > 100 || repo.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Owner or repo name is too long"
      });
    }
  }

  next();
};

const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized - Invalid API Key"
    });
  }

  next();
};

module.exports = { validateRequest, validateApiKey };
