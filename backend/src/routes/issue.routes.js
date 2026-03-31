const express = require("express");
const router = express.Router();
const {
  getIssues
} = require("../controllers/issue.controller");

router.get("/:owner/:repo", getIssues);

module.exports = router;