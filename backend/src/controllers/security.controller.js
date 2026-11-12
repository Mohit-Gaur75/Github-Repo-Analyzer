const { getSecurity } = require("../services/security.service");
const { scanRepositoryCVEs } = require("../services/cve.service");
const { asyncHandler } = require("../middlewares/error.middleware");

// GET /api/security/:owner/:repo
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

// GET /api/security/:owner/:repo/cve
exports.getCVEScan = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    return res.status(400).json({
      success: false,
      error: "Owner and repo parameters are required"
    });
  }

  const scanResult = await scanRepositoryCVEs(owner, repo);

  res.json({
    success: true,
    data: scanResult
  });
});
