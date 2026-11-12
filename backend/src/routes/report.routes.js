const express = require("express");
const router = express.Router();
const { getExecutiveReport } = require("../controllers/report.controller");

// GET /api/report/:owner/:repo
router.get("/:owner/:repo", getExecutiveReport);

module.exports = router;
