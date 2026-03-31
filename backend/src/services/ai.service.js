const generateSummary = (repoData, analysisData) => {
  const {
    name,
    description,
    stars,
    forks,
    language,
    createdAt,
    updatedAt
  } = repoData;

  const ageInDays = Math.floor(
    (Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24)
  );

  const ageInYears = (ageInDays / 365).toFixed(1);

  const summary = {
    overview: `${name} is a ${language || "multi-language"} repository with ${stars?.toLocaleString() || 0} stars and ${forks?.toLocaleString() || 0} forks. It has been active for ${ageInYears} years.`,
    activity:
      analysisData?.commits?.totalCommitsLastYear > 100
        ? "This is a highly active repository with frequent commits."
        : analysisData?.commits?.totalCommitsLastYear > 20
        ? "This repository shows moderate activity."
        : "This repository has low recent activity.",
    community:
      analysisData?.contributors?.totalContributors > 50
        ? "Large community with many contributors."
        : analysisData?.contributors?.totalContributors > 10
        ? "Medium-sized contributor community."
        : "Small contributor base — consider reaching out for contributors.",
    health:
      analysisData?.quality?.healthScore >= 80
        ? "The repository is in excellent health."
        : analysisData?.quality?.healthScore >= 60
        ? "The repository is in good health with some areas to improve."
        : "The repository needs attention in several areas.",
    description: description || "No description provided."
  };

  return summary;
};

const generateInsights = (analysisData) => {
  const insights = [];

  if (analysisData?.commits?.averageCommitsPerWeek > 10) {
    insights.push({
      type: "positive",
      title: "High Commit Frequency",
      message: `Averaging ${analysisData.commits.averageCommitsPerWeek} commits per week shows strong development activity.`
    });
  }

  if (analysisData?.issues?.closeRate > 80) {
    insights.push({
      type: "positive",
      title: "Excellent Issue Resolution",
      message: `${analysisData.issues.closeRate}% of issues are resolved — great maintainer responsiveness.`
    });
  }

  if (analysisData?.prs?.mergeRate > 70) {
    insights.push({
      type: "positive",
      title: "High PR Merge Rate",
      message: `${analysisData.prs.mergeRate}% of pull requests are merged — contributors are well-guided.`
    });
  }

  if (analysisData?.contributors?.busFactorRisk === "High") {
    insights.push({
      type: "warning",
      title: "Bus Factor Risk",
      message:
        "Very few contributors — the project may be at risk if key maintainers leave."
    });
  }

  if (analysisData?.security?.securityScore < 50) {
    insights.push({
      type: "warning",
      title: "Security Improvements Needed",
      message:
        "Several security best practices are missing. Review the security recommendations."
    });
  }

  if (analysisData?.quality?.qualityScore < 50) {
    insights.push({
      type: "warning",
      title: "Quality Improvements Needed",
      message:
        "Missing key documentation files. Consider adding README, LICENSE, and CONTRIBUTING guides."
    });
  }

  return insights;
};

module.exports = { generateSummary, generateInsights };
