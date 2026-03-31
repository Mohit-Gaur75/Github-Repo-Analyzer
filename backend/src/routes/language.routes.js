const express = require("express");
const router = express.Router();
const {
  getLanguages
} = require("../controllers/language.controller");

router.get("/:owner/:repo", getLanguages);

module.exports = router;