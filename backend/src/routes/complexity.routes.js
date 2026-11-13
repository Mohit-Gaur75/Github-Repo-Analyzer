const express = require("express");
const router = express.Router();
const { getComplexity } = require("../controllers/complexity.controller");

router.get("/:owner/:repo", getComplexity);

module.exports = router;
