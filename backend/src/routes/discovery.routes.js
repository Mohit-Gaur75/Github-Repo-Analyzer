const express = require("express");
const router = express.Router();
const { getTrending } = require("../controllers/discovery.controller");

router.get("/trending", getTrending);

module.exports = router;
