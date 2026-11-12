const { githubRequest } = require("../utils/githubApi");
const { getQuality } = require("./quality.service");
const { getSecurity } = require("./security.service");
const { detectTechStack } = require("./techstack.service");
const { getContributors } = require("./contributor.service");
const { getReleaseIntelligence } = require("./release.service");

/**
 * Generate a consolidated executive repository audit report
 */
const generateExecutiveReport = async (owner, repo) => {
  try {
    const [repoData, quality, security, techStack, contributors, releases] =
      await Promise.all([
        githubRequest(`/repos/${owner}/${repo}`),
        getQuality(owner, repo).catch(() => ({ healthScore: 0, healthGrade: "N/A" })),
        getSecurity(owner, repo).catch(() => ({ securityScore: 0, securityRating: "N/A", risks: [] })),
        detectTechStack(owner, repo).catch(() => ({ summary: "Unknown", layers: {} })),
        getContributors(owner, repo).catch(() => ({ busFactor: { busFactor: 0, riskLevel: "Unknown" }, resilience: { score: 0 } })),
        getReleaseIntelligence(owner, repo).catch(() => ({ latestRelease: null, cadence: { status: "Unknown" } }))
      ]);

    const stars = repoData.stargazers_count || 0;
    const forks = repoData.forks_count || 0;
    const ageInYears = (
      (Date.now() - new Date(repoData.created_at).getTime()) /
      (1000 * 60 * 60 * 24 * 365)
    ).toFixed(1);

    const healthScore = quality.healthScore || 0;
    const securityScore = security.securityScore || 0;
    const resilienceScore = contributors.resilience?.score || 0;

    // Weighted Overall Grade
    const overallScore = Math.round(healthScore * 0.35 + securityScore * 0.35 + resilienceScore * 0.3);

    let overallGrade = "A";
    if (overallScore < 50) overallGrade = "F";
    else if (overallScore < 65) overallGrade = "D";
    else if (overallScore < 75) overallGrade = "C";
    else if (overallScore < 88) overallGrade = "B";

    // High-priority consolidated recommendations
    const recommendations = [];
    if (security.risks?.length > 0) {
      recommendations.push({
        area: "Security",
        priority: "HIGH",
        action: `Remediate ${security.risks.length} security risks/vulnerabilities flagged in the audit.`
      });
    }
    if (contributors.busFactor?.busFactor <= 2) {
      recommendations.push({
        area: "Governance",
        priority: "MEDIUM",
        action: `Increase community maintainers to improve the low Bus Factor (${contributors.busFactor.busFactor}).`
      });
    }
    if (!quality.checks?.hasCICD) {
      recommendations.push({
        area: "DevOps",
        priority: "HIGH",
        action: "Set up automated CI/CD workflows for build and test validation."
      });
    }
    if (!quality.checks?.hasContributing) {
      recommendations.push({
        area: "Documentation",
        priority: "LOW",
        action: "Add a CONTRIBUTING.md guide to streamline open-source onboarding."
      });
    }

    return {
      reportId: `RPT-${owner}-${repo}-${Date.now().toString(36).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      repo: {
        owner: repoData.owner?.login || owner,
        name: repoData.name || repo,
        fullName: repoData.full_name,
        description: repoData.description || "No description provided.",
        url: repoData.html_url,
        license: repoData.license?.name || "None",
        primaryLanguage: repoData.language || "Unknown",
        stars,
        forks,
        openIssues: repoData.open_issues_count || 0,
        ageInYears,
        sizeMB: (repoData.size / 1024).toFixed(1)
      },
      scores: {
        overallScore,
        overallGrade,
        healthScore,
        healthGrade: quality.healthGrade || "N/A",
        securityScore,
        securityRating: security.securityRating || "N/A",
        cveGrade: security.cveScan?.grade || "N/A",
        resilienceScore,
        resilienceStatus: contributors.resilience?.status || "N/A"
      },
      techStack: {
        summary: techStack.summary || "Full-Stack Project",
        archType: techStack.archType || "Software Application",
        detectedCount: techStack.totalDetected || 0,
        mainTechnologies: (techStack.allDetected || []).slice(0, 8).map((t) => t.name)
      },
      securityAudit: {
        score: securityScore,
        rating: security.securityRating,
        risksCount: security.risks?.length || 0,
        knownCVEs: security.cveScan?.vulnerabilities?.length || 0,
        scannedManifest: security.cveScan?.manifestType || "None",
        topRisks: (security.risks || []).slice(0, 4)
      },
      governance: {
        busFactor: contributors.busFactor?.busFactor || 0,
        riskLevel: contributors.busFactor?.riskLevel || "Unknown",
        totalContributors: contributors.totalContributors || 0,
        giniIndex: contributors.giniIndex || 0,
        keyMaintainers: contributors.busFactor?.keyMaintainers || []
      },
      shipping: {
        latestVersion: releases.latestRelease?.tag || "None",
        cadenceStatus: releases.cadence?.status || "Unknown",
        avgDaysBetweenReleases: releases.cadence?.avgDaysBetweenReleases || null,
        totalReleases: releases.totalReleases || 0
      },
      recommendations
    };
  } catch (error) {
    throw new Error(`Failed to generate executive report: ${error.message}`);
  }
};

module.exports = { generateExecutiveReport };
