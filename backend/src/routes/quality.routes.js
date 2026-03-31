const express = require("express");
const router = express.Router();
const {
  getQuality
} = require("../controllers/quality.controller");

router.get("/:owner/:repo", getQuality);

module.exports = router;