const express = require("express");
const router = express.Router();
const {
  getContributors
} = require("../controllers/contributor.controller");

router.get("/:owner/:repo", getContributors);

module.exports = router;