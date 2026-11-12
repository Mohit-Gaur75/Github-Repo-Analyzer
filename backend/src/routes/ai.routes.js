const express = require("express");
const router = express.Router();
const { getAIInsights } = require("../controllers/ai.controller");

// GET /api/ai/:owner/:repo  — generate Gemini AI analysis
router.get("/:owner/:repo", getAIInsights);

module.exports = router;
