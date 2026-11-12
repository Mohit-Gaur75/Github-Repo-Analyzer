const express = require("express");
const router = express.Router();
const { getActivity, streamActivity } = require("../controllers/activity.controller");

// GET /api/activity/:owner/:repo        — paginated recent events (cached)
router.get("/:owner/:repo", getActivity);

// GET /api/activity/:owner/:repo/stream — SSE live event stream (never cached)
router.get("/:owner/:repo/stream", streamActivity);

module.exports = router;
