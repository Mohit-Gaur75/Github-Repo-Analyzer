const express = require("express");
const router = express.Router();
const {
  getWatchlist,
  addToWatchlist,
  checkWatchlist,
  removeFromWatchlist,
  clearWatchlist
} = require("../controllers/watchlist.controller");

router.get("/", getWatchlist);
router.post("/", addToWatchlist);
router.delete("/", clearWatchlist);
router.get("/:owner/:repo", checkWatchlist);
router.delete("/:owner/:repo", removeFromWatchlist);

module.exports = router;
