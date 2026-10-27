

const { getSecurity } = require("../services/security.service");
const { asyncHandler } = require("../middlewares/error.middleware");

exports.getSecurity = asyncHandler(async (req, res) => {
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
});
