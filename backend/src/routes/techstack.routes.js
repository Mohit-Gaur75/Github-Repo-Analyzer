const express = require("express");
const router = express.Router();
const { getTechStack } = require("../controllers/techstack.controller");

// GET /api/techstack/:owner/:repo
router.get("/:owner/:repo", getTechStack);

module.exports = router;
