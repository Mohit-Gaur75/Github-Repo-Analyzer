const { getTrendingRepos } = require("../services/discovery.service");

exports.getTrending = async (req, res, next) => {
  try {
    const {
      timeframe = "weekly",
      language = "",
      topic = "",
      q = "",
      sort = "stars",
      order = "desc",
      page = 1,
      limit = 25
    } = req.query;

    const result = await getTrendingRepos({
      timeframe,
      language,
      topic,
      query: q,
      sort,
      order,
      page: parseInt(page, 10) || 1,
      perPage: Math.min(parseInt(limit, 10) || 25, 50)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
