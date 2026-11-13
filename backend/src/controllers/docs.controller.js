const { openApiSpec, getSwaggerHtml, generateDemoApiKey } = require("../services/docs.service");

exports.getSpec = (req, res) => {
  res.json(openApiSpec);
};

exports.getUi = (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(getSwaggerHtml());
};

exports.generateKey = (req, res) => {
  const { key, expiresAt } = generateDemoApiKey();
  res.json({
    success: true,
    apiKey: key,
    tier: "Sandbox Developer",
    rateLimit: "100 requests / 15 minutes",
    expiresAt: new Date(expiresAt).toISOString(),
    message: "Sandbox API key generated successfully. Include 'X-API-Key: " + key + "' in request headers."
  });
};
