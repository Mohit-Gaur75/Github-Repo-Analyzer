const { generateBadge, getAllBadgeSnippets } = require("../services/badge.service");

exports.getBadgeSvg = async (req, res, next) => {
  try {
    const { owner, repo, metric } = req.params;
    const { style = "flat" } = req.query;

    const svg = await generateBadge(owner, repo, metric, style);

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.send(svg);
  } catch (error) {
    next(error);
  }
};

exports.getBadgesList = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:5001";
    const baseUrl = `${protocol}://${host}`;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const badges = getAllBadgeSnippets(owner, repo, baseUrl, clientUrl);

    res.json({
      success: true,
      repository: `${owner}/${repo}`,
      badges
    });
  } catch (error) {
    next(error);
  }
};
