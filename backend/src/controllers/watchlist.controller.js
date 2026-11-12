const {
  getAllWatchlist,
  addRepoToWatchlist,
  removeRepoFromWatchlist,
  isRepoWatchlisted,
  clearAllWatchlist
} = require("../services/watchlist.service");

exports.getWatchlist = async (req, res, next) => {
  try {
    const list = await getAllWatchlist();
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

exports.addToWatchlist = async (req, res, next) => {
  try {
    const { owner, repo, note, metadata } = req.body;
    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        error: "Owner and repo are required in request body"
      });
    }

    const item = await addRepoToWatchlist({ owner, repo, note, metadata });
    res.status(201).json({
      success: true,
      message: `${item.fullName} added to watchlist`,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

exports.checkWatchlist = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const watchlisted = await isRepoWatchlisted(owner, repo);
    res.json({
      success: true,
      fullName: `${owner}/${repo}`,
      watchlisted
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFromWatchlist = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const result = await removeRepoFromWatchlist(owner, repo);
    res.json({
      success: true,
      message: `${result.fullName} removed from watchlist`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.clearWatchlist = async (req, res, next) => {
  try {
    const result = await clearAllWatchlist();
    res.json({
      success: true,
      message: `Watchlist cleared (${result.clearedCount} items removed)`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
