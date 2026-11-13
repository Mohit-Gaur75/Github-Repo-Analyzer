const { getOrganizationPortfolio } = require("../services/org.service");

exports.getOrg = async (req, res, next) => {
  try {
    const { org } = req.params;

    if (!org) {
      return res.status(400).json({
        success: false,
        error: "Organization name is required"
      });
    }

    const data = await getOrganizationPortfolio(org);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
