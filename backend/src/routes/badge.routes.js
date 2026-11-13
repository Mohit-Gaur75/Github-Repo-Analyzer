const express = require("express");
const router = express.Router();
const { getBadgeSvg, getBadgesList } = require("../controllers/badge.controller");

router.get("/:owner/:repo", getBadgesList);
router.get("/:owner/:repo/:metric", getBadgeSvg);

module.exports = router;
