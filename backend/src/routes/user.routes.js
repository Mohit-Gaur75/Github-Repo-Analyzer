const express = require("express");
const router = express.Router();
const { getUserProfile } = require("../controllers/user.controller");

// GET /api/user/:username
router.get("/:username", getUserProfile);

module.exports = router;
