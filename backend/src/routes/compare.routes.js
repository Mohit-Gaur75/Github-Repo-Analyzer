const express = require("express");
const router = express.Router();
const { compareRepos } = require("../controllers/compare.controller");

// GET /api/compare/:owner1/:repo1/:owner2/:repo2
router.get("/:owner1/:repo1/:owner2/:repo2", compareRepos);

module.exports = router;
