const { generateRepositorySBOM } = require("../services/sbom.service");

exports.getSBOM = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const sbom = await generateRepositorySBOM(owner, repo);
    res.json({
      success: true,
      data: {
        repository: sbom.repository,
        generatedAt: sbom.generatedAt,
        totalComponents: sbom.totalComponents,
        runtimeCount: sbom.runtimeCount,
        devCount: sbom.devCount,
        ecosystems: sbom.ecosystems,
        complianceStatus: sbom.complianceStatus,
        components: sbom.components
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.exportSPDX = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const sbom = await generateRepositorySBOM(owner, repo);
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${owner}-${repo}-spdx.json"`
    );
    res.send(JSON.stringify(sbom.spdx, null, 2));
  } catch (error) {
    next(error);
  }
};

exports.exportCycloneDX = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const sbom = await generateRepositorySBOM(owner, repo);
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${owner}-${repo}-cyclonedx.json"`
    );
    res.send(JSON.stringify(sbom.cyclonedx, null, 2));
  } catch (error) {
    next(error);
  }
};

exports.exportCSV = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const sbom = await generateRepositorySBOM(owner, repo);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${owner}-${repo}-sbom.csv"`
    );
    res.send(sbom.csv);
  } catch (error) {
    next(error);
  }
};
