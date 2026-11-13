const express = require("express");
const router = express.Router();
const {
  getSBOM,
  exportSPDX,
  exportCycloneDX,
  exportCSV
} = require("../controllers/sbom.controller");

router.get("/:owner/:repo", getSBOM);
router.get("/:owner/:repo/spdx", exportSPDX);
router.get("/:owner/:repo/cyclonedx", exportCycloneDX);
router.get("/:owner/:repo/csv", exportCSV);

module.exports = router;
