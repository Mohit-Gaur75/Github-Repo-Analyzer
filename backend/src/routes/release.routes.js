const express = require("express");
const router = express.Router();
const { getReleases } = require("../controllers/release.controller");

// GET /api/releases/:owner/:repo
router.get("/:owner/:repo", getReleases);

module.exports = router;
