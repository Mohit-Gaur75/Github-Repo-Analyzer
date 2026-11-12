const { githubRequest, githubRequestSafe } = require("../utils/githubApi");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (endpoint, retries = 3, delayMs = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await githubRequest(endpoint);
      if (data && (Array.isArray(data) ? data.length > 0 : true)) {
        return data;
      }
      await sleep(delayMs);
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(delayMs);
    }
  }
  return null;
};

/**
 * Calculate the Gini Inequality Coefficient (0.00 = perfect equality, 1.00 = total monopoly)
 */
const calculateGini = (contributions = []) => {
  if (contributions.length <= 1) return 0;
  const sorted = [...contributions].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;

  let weightedSum = 0;
  for (let i = 0; i < n; i++) {
    weightedSum += (i + 1) * sorted[i];
  }

  const gini = (2 * weightedSum) / (n * sum) - (n + 1) / n;
  return parseFloat(Math.max(0, Math.min(1, gini)).toFixed(2));
};

/**
 * Calculate Bus Factor (minimum developers responsible for >= 65% of contributions)
 */
const calculateBusFactor = (contributors, totalContributions) => {
  if (contributors.length === 0 || totalContributions === 0) {
    return {
      busFactor: 0,
      riskLevel: "Critical",
      riskColor: "#dc3545",
      sharePercentage: 0,
      keyMaintainers: [],
      description: "No contributors recorded for this repository."
    };
  }

  let accumulated = 0;
  let count = 0;
  const keyMaintainers = [];
  const targetThreshold = totalContributions * 0.65;

  for (const c of contributors) {
    accumulated += c.contributions;
    count++;
    keyMaintainers.push(c.login);
    if (accumulated >= targetThreshold) break;
  }

  const sharePercentage = Math.round((accumulated / totalContributions) * 100);

  let riskLevel = "Low Risk";
  let riskColor = "#28a745";
  let description = `Healthy community distribution. ${count} developers share 65%+ of contributions.`;

  if (count === 1) {
    riskLevel = "Critical Risk";
    riskColor = "#dc3545";
    description = `Extreme maintainer bottleneck. ${keyMaintainers[0]} alone accounts for ${sharePercentage}% of all contributions.`;
  } else if (count === 2) {
    riskLevel = "High Risk";
    riskColor = "#fd7e14";
    description = `High dependency on just 2 maintainers (${keyMaintainers.join(" & ")}) for ${sharePercentage}% of code.`;
  } else if (count <= 4) {
    riskLevel = "Moderate Risk";
    riskColor = "#f4a900";
    description = `Core maintainer group of ${count} developers maintains majority (${sharePercentage}%) ownership.`;
  }

  return {
    busFactor: count,
    riskLevel,
    riskColor,
    sharePercentage,
    keyMaintainers,
    description
  };
};

/**
 * Categorize contributors into Core (0-70%), Regular (70-95%), and Casual (95-100%)
 */
const segmentContributors = (contributors, totalContributions) => {
  if (totalContributions === 0) return { core: [], regular: [], casual: [] };

  const core = [];
  const regular = [];
  const casual = [];

  let cumulative = 0;

  contributors.forEach((c) => {
    const share = (c.contributions / totalContributions) * 100;
    cumulative += share;

    if (cumulative <= 72 || core.length === 0) {
      core.push({ ...c, role: "Core Maintainer" });
    } else if (cumulative <= 96) {
      regular.push({ ...c, role: "Regular Contributor" });
    } else {
      casual.push({ ...c, role: "Casual Contributor" });
    }
  });

  return {
    coreCount: core.length,
    regularCount: regular.length,
    casualCount: casual.length,
    coreTopList: core.slice(0, 5),
    segments: {
      corePercent: Math.min(100, Math.round((core.length / Math.max(1, contributors.length)) * 100)),
      regularPercent: Math.min(100, Math.round((regular.length / Math.max(1, contributors.length)) * 100)),
      casualPercent: Math.min(100, Math.round((casual.length / Math.max(1, contributors.length)) * 100))
    }
  };
};

/**
 * Community Resilience Score (0 - 100)
 */
const calculateResilienceScore = (busFactor, totalContributors, gini) => {
  // Bus factor score (max 40 pts)
  const bfScore = Math.min(40, busFactor * 8);

  // Pool size score (max 35 pts)
  const poolScore = Math.min(35, Math.round(Math.log10(Math.max(1, totalContributors)) * 17.5));

  // Gini equality score (max 25 pts)
  // Low gini (0.4) is more resilient than extreme gini (0.95)
  const giniScore = Math.max(0, Math.round((1 - gini) * 25));

  const total = Math.min(100, bfScore + poolScore + giniScore);

  let status = "Robust & Decentralized";
  if (total < 40) status = "Fragile / Solo Dependency";
  else if (total < 65) status = "Moderate Maintainer Dependency";
  else if (total < 85) status = "Healthy Active Core";

  return {
    score: total,
    status
  };
};

exports.getContributors = async (owner, repo) => {
  try {
    const [contributors, stats] = await Promise.all([
      githubRequestSafe(
        `/repos/${owner}/${repo}/contributors?per_page=100&anon=false`
      ),
      fetchWithRetry(
        `/repos/${owner}/${repo}/stats/contributors`
      ).catch(() => null)
    ]);

    const contributorList = Array.isArray(contributors)
      ? contributors.map((contributor) => ({
          login: contributor?.login || "Unknown",
          id: contributor?.id || null,
          avatar: contributor?.avatar_url || null,
          url: contributor?.html_url || null,
          contributions: contributor?.contributions || 0,
          type: contributor?.type || "User"
        }))
      : [];

    const totalContributions = contributorList.reduce(
      (sum, c) => sum + (c.contributions || 0),
      0
    );

    // 1. Bus Factor Calculator
    const busFactorAnalysis = calculateBusFactor(contributorList, totalContributions);

    // 2. Gini Coefficient
    const giniIndex = calculateGini(contributorList.map((c) => c.contributions));

    // 3. Contributor Segmentation
    const segmentation = segmentContributors(contributorList, totalContributions);

    // 4. Community Resilience
    const resilience = calculateResilienceScore(
      busFactorAnalysis.busFactor,
      contributorList.length,
      giniIndex
    );

    // Format individual contributors with roles and share percentage
    const enrichedContributors = contributorList.map((c, i) => {
      const share = totalContributions > 0
        ? parseFloat(((c.contributions / totalContributions) * 100).toFixed(1))
        : 0;

      let role = "Casual";
      if (i < segmentation.coreCount) role = "Core";
      else if (i < segmentation.coreCount + segmentation.regularCount) role = "Regular";

      return {
        ...c,
        rank: i + 1,
        share,
        role
      };
    });

    const contributorStats = Array.isArray(stats)
      ? stats
          .filter((stat) => stat?.author)
          .map((stat) => ({
            login: stat?.author?.login || "Unknown",
            avatar: stat?.author?.avatar_url || null,
            totalCommits: stat?.total || 0,
            weeks: Array.isArray(stat?.weeks)
              ? stat.weeks.map((week) => ({
                  week: week?.w || 0,
                  additions: week?.a || 0,
                  deletions: week?.d || 0,
                  commits: week?.c || 0
                }))
              : []
          }))
      : [];

    return {
      contributors: enrichedContributors,
      topContributors: enrichedContributors.slice(0, 10),
      totalContributors: contributorList.length,
      totalContributions,
      busFactor: busFactorAnalysis,
      busFactorRisk: busFactorAnalysis.riskLevel, // for backwards-compatibility
      giniIndex,
      segmentation,
      resilience,
      contributorStats,
      dataAvailable: contributorList.length > 0
    };
  } catch (error) {
    console.error("Contributor service error:", error.message);
    return {
      contributors: [],
      topContributors: [],
      totalContributors: 0,
      totalContributions: 0,
      busFactor: {
        busFactor: 0,
        riskLevel: "Unknown",
        riskColor: "#6c757d",
        sharePercentage: 0,
        keyMaintainers: [],
        description: error.message
      },
      busFactorRisk: "Unknown",
      giniIndex: 0,
      segmentation: { coreCount: 0, regularCount: 0, casualCount: 0, segments: {} },
      resilience: { score: 0, status: "Unknown" },
      contributorStats: [],
      dataAvailable: false,
      error: error.message
    };
  }
};
