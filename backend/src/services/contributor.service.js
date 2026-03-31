const { githubRequest, githubRequestSafe } = require("../utils/githubApi");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (endpoint, retries = 3, delayMs = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await githubRequest(endpoint);
      if (data && (Array.isArray(data) ? data.length > 0 : true)) {
        return data;
      }
      console.log(
        `Retry ${i + 1}/${retries} for ${endpoint} — GitHub still computing...`
      );
      await sleep(delayMs);
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(delayMs);
    }
  }
  return null;
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

    const topContributors = contributorList.slice(0, 10);

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

    const busFactorRisk =
      contributorList.length <= 2
        ? "High"
        : contributorList.length <= 5
        ? "Medium"
        : "Low";

    return {
      contributors: contributorList,
      topContributors,
      totalContributors: contributorList.length,
      totalContributions,
      contributorStats,
      busFactorRisk,
      dataAvailable: contributorList.length > 0
    };
  } catch (error) {
    console.error("Contributor service error:", error.message);
    return {
      contributors: [],
      topContributors: [],
      totalContributors: 0,
      totalContributions: 0,
      contributorStats: [],
      busFactorRisk: "Unknown",
      dataAvailable: false,
      error: error.message
    };
  }
};