const SECRET_PATTERNS = [
  {
    name: "AWS Access Key",
    pattern: /AKIA[0-9A-Z]{16}/,
    severity: "critical"
  },
  {
    name: "AWS Secret Key",
    pattern: /aws_secret_access_key\s*=\s*[^\s]+/i,
    severity: "critical"
  },
  {
    name: "GitHub Token",
    pattern: /ghp_[a-zA-Z0-9]{36}/,
    severity: "critical"
  },
  {
    name: "GitHub OAuth Token",
    pattern: /gho_[a-zA-Z0-9]{36}/,
    severity: "critical"
  },
  {
    name: "Private Key",
    pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/,
    severity: "critical"
  },
  {
    name: "Generic API Key",
    pattern: /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i,
    severity: "high"
  },
  {
    name: "Generic Secret",
    pattern: /secret[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i,
    severity: "high"
  },
  {
    name: "Password in Code",
    pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
    severity: "medium"
  },
  {
    name: "Database URL",
    pattern: /mongodb(\+srv)?:\/\/[^\s]+/i,
    severity: "high"
  },
  {
    name: "JWT Token",
    pattern: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
    severity: "medium"
  }
];

const scanForSecrets = (content) => {
  if (!content || typeof content !== "string") {
    return [];
  }

  const findings = [];

  for (const { name, pattern, severity } of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      findings.push({
        type: name,
        severity,
        recommendation: `Remove the ${name} from the codebase and rotate it immediately`
      });
    }
  }

  return findings;
};

const getSeverityScore = (findings) => {
  if (!findings || findings.length === 0) return 0;

  const weights = { critical: 40, high: 20, medium: 10, low: 5 };
  const total = findings.reduce((sum, f) => sum + (weights[f.severity] || 0), 0);
  return Math.min(100, total);
};

module.exports = { scanForSecrets, getSeverityScore, SECRET_PATTERNS };
