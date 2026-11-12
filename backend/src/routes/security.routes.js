const express = require("express");
const router = express.Router();
const {
  getSecurity,
  getCVEScan
} = require("../controllers/security.controller");

// GET /api/security/:owner/:repo/cve — specific CVE dependency scan
router.get("/:owner/:repo/cve", getCVEScan);

// GET /api/security/:owner/:repo     — comprehensive security & CVE analysis
router.get("/:owner/:repo", getSecurity);

module.exports = router;
