const express = require("express");
const router = express.Router();
const { getSpec, getUi, generateKey } = require("../controllers/docs.controller");

router.get("/spec", getSpec);
router.get("/openapi.json", getSpec);
router.get("/keys/generate", generateKey);
router.post("/keys/generate", generateKey);
router.get("/", getUi);

module.exports = router;
