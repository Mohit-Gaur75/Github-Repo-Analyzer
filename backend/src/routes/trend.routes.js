const express = require("express");
const router = express.Router();
const { getRepoTrend } = require("../controllers/trend.controller");

// GET /api/trend/:owner/:repo
router.get("/:owner/:repo", getRepoTrend);

module.exports = router;
