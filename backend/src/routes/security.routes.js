const express = require("express");
const router = express.Router();
const {
  getSecurity
} = require("../controllers/security.controller");

router.get("/:owner/:repo", getSecurity);

module.exports = router;