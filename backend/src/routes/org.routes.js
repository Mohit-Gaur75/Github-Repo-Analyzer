const express = require("express");
const router = express.Router();
const { getOrg } = require("../controllers/org.controller");

router.get("/:org", getOrg);

module.exports = router;
