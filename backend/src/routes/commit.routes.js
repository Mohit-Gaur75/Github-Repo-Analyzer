const express = require("express");
const router = express.Router();
const {
  getCommits
} = require("../controllers/commit.controller");

router.get("/:owner/:repo", getCommits);

module.exports = router;