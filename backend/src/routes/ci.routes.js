const express = require("express");
const router = express.Router();
const { getCIHealth } = require("../controllers/ci.controller");

router.get("/:owner/:repo", getCIHealth);

module.exports = router;
