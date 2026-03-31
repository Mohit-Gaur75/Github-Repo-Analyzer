const express = require("express");
const router = express.Router();
const {
  getRepoDetails,
  validateRepo,
  getFullAnalysis,
  getRecentRepos
} = require("../controllers/repo.controller");

router.post("/validate", validateRepo);
router.get("/recent", getRecentRepos);
router.get("/analysis/:owner/:repo", getFullAnalysis);
router.get("/:owner/:repo", getRepoDetails);

module.exports = router;