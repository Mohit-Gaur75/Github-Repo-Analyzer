const { githubRequestSafe } = require("../utils/githubApi");
const { calculateHealthScore } = require("../utils/healthScore");

exports.getQuality = async (owner, repo) => {
  try {
    const [repoData, contents, workflows] = await Promise.all([
      githubRequestSafe(`/repos/${owner}/${repo}`),
      githubRequestSafe(`/repos/${owner}/${repo}/contents`),
      githubRequestSafe(
        `/repos/${owner}/${repo}/actions/workflows`
      )
    ]);

    const files = (contents || []).map((f) => f.name.toLowerCase());

    const hasReadme = files.some((f) => f.startsWith("readme"));
    const hasLicense = files.some(
      (f) => f.startsWith("license") || f.startsWith("licence")
    );
    const hasContributing = files.some((f) =>
      f.startsWith("contributing")
    );
    const hasChangelog = files.some((f) =>
      f.startsWith("changelog")
    );
    const hasCodeOfConduct = files.some((f) =>
      f.includes("code_of_conduct")
    );
    const hasCICD =
      (workflows?.total_count || 0) > 0 ||
      files.some((f) => f === ".github");
    const hasTests = files.some(
      (f) =>
        f === "test" ||
        f === "tests" ||
        f === "__tests__" ||
        f === "spec"
    );
    const hasDocker = files.some(
      (f) => f === "dockerfile" || f === "docker-compose.yml"
    );

    const checks = {
      hasReadme,
      hasLicense,
      hasContributing,
      hasChangelog,
      hasCodeOfConduct,
      hasCICD,
      hasTests,
      hasDocker
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    const qualityScore = Math.round((passedChecks / totalChecks) * 100);

    const healthScore = repoData
      ? calculateHealthScore(repoData)
      : { score: 0, grade: "F" };

    return {
      checks,
      qualityScore,
      passedChecks,
      totalChecks,
      healthScore: healthScore.score,
      healthGrade: healthScore.grade,
      healthBreakdown: healthScore.breakdown,
      workflows: {
        total: workflows?.total_count || 0,
        items: (workflows?.workflows || []).slice(0, 5).map((w) => ({
          name: w.name,
          state: w.state,
          url: w.html_url
        }))
      },
      recommendations: generateRecommendations(checks)
    };
  } catch (error) {
    throw new Error(`Failed to fetch quality data: ${error.message}`);
  }
};

const generateRecommendations = (checks) => {
  const recommendations = [];

  if (!checks.hasReadme)
    recommendations.push("Add a README.md file to document your project");
  if (!checks.hasLicense)
    recommendations.push("Add a LICENSE file to define usage terms");
  if (!checks.hasContributing)
    recommendations.push(
      "Add a CONTRIBUTING.md to guide contributors"
    );
  if (!checks.hasChangelog)
    recommendations.push(
      "Add a CHANGELOG.md to track version history"
    );
  if (!checks.hasCICD)
    recommendations.push(
      "Set up CI/CD workflows for automated testing"
    );
  if (!checks.hasTests)
    recommendations.push(
      "Add a tests directory for automated testing"
    );
  if (!checks.hasCodeOfConduct)
    recommendations.push(
      "Add a CODE_OF_CONDUCT.md for community guidelines"
    );

  return recommendations;
};