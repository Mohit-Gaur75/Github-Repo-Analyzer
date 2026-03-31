const { githubRequestSafe } = require("../utils/githubApi");
const { scanForSecrets, getSeverityScore } = require("../utils/secretScanner");

exports.getSecurity = async (owner, repo) => {
  try {
    const [repoData, contents, topics] = await Promise.all([
      githubRequestSafe(`/repos/${owner}/${repo}`),
      githubRequestSafe(`/repos/${owner}/${repo}/contents`),
      githubRequestSafe(`/repos/${owner}/${repo}/topics`, {
        headers: {
          Accept: "application/vnd.github.mercy-preview+json"
        }
      })
    ]);

    const files = (contents || []).map((f) => f.name.toLowerCase());

    const hasSecurityPolicy = files.some(
      (f) => f === "security.md" || f === ".github"
    );
    const hasDependabot = files.some(
      (f) => f === ".github" || f === "dependabot.yml"
    );
    const hasEnvExample = files.some(
      (f) => f === ".env.example" || f === ".env.sample"
    );
    const hasGitignore = files.some((f) => f === ".gitignore");
    const hasEnvFile = files.some(
      (f) => f === ".env" || f === ".env.local"
    );

    const securityChecks = {
      hasSecurityPolicy,
      hasDependabot,
      hasEnvExample,
      hasGitignore,
      noEnvFileExposed: !hasEnvFile
    };

    const passedChecks = Object.values(securityChecks).filter(
      Boolean
    ).length;
    const totalChecks = Object.keys(securityChecks).length;
    const securityScore = Math.round(
      (passedChecks / totalChecks) * 100
    );

    const isArchived = repoData?.archived || false;
    const hasVulnerabilityAlerts =
      repoData?.has_vulnerability_alerts || false;

    const risks = [];
    if (hasEnvFile)
      risks.push({
        type: "Exposed env file",
        severity: "critical",
        description:
          ".env file detected in repository root — may contain secrets"
      });
    if (!hasGitignore)
      risks.push({
        type: "Missing .gitignore",
        severity: "medium",
        description:
          "No .gitignore file found — sensitive files may be accidentally committed"
      });
    if (!hasSecurityPolicy)
      risks.push({
        type: "No security policy",
        severity: "low",
        description:
          "Add a SECURITY.md to define how to report vulnerabilities"
      });
    if (!hasDependabot)
      risks.push({
        type: "No dependency updates",
        severity: "medium",
        description:
          "Enable Dependabot to automatically update vulnerable dependencies"
      });

    return {
      securityChecks,
      securityScore,
      passedChecks,
      totalChecks,
      risks,
      isArchived,
      hasVulnerabilityAlerts,
      securityRating:
        securityScore >= 80
          ? "Good"
          : securityScore >= 60
          ? "Fair"
          : securityScore >= 40
          ? "Poor"
          : "Critical",
      recommendations: generateSecurityRecommendations(securityChecks)
    };
  } catch (error) {
    throw new Error(`Failed to fetch security data: ${error.message}`);
  }
};

const generateSecurityRecommendations = (checks) => {
  const recommendations = [];

  if (!checks.hasSecurityPolicy)
    recommendations.push(
      "Create a SECURITY.md file with vulnerability reporting guidelines"
    );
  if (!checks.hasDependabot)
    recommendations.push(
      "Enable Dependabot alerts for automatic dependency updates"
    );
  if (!checks.hasEnvExample)
    recommendations.push(
      "Add a .env.example file to document required environment variables"
    );
  if (!checks.hasGitignore)
    recommendations.push(
      "Add a .gitignore file to prevent committing sensitive files"
    );
  if (!checks.noEnvFileExposed)
    recommendations.push(
      "Remove .env file from repository and add it to .gitignore immediately"
    );

  return recommendations;
};