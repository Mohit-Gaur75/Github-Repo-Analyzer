const express = require("express");
const router = express.Router();
const {
  getPullRequests
} = require("../controllers/pr.controller");

router.get("/:owner/:repo", getPullRequests);

module.exports = router;