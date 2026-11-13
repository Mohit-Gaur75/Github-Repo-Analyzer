const express = require("express");
const router = express.Router();
const {
  getCommits,
  getCommitCalendar
} = require("../controllers/commit.controller");

router.get("/:owner/:repo/calendar", getCommitCalendar);
router.get("/:owner/:repo", getCommits);

module.exports = router;
