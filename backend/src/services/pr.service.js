const { githubRequestSafe } = require("../utils/githubApi");

exports.getPullRequests = async (owner, repo) => {
  try {
    const [openPRs, closedPRs] = await Promise.all([
      githubRequestSafe(
        `/repos/${owner}/${repo}/pulls?state=open&per_page=100`
      ),
      githubRequestSafe(
        `/repos/${owner}/${repo}/pulls?state=closed&per_page=100`
      )
    ]);

    const open = openPRs || [];
    const closed = closedPRs || [];
    const allPRs = [...open, ...closed];

    const merged = closed.filter((pr) => pr.merged_at !== null);

    const avgMergeTime =
      merged.length > 0
        ? merged.reduce((sum, pr) => {
            const created = new Date(pr.created_at);
            const mergedAt = new Date(pr.merged_at);
            return sum + (mergedAt - created) / (1000 * 60 * 60 * 24);
          }, 0) / merged.length
        : 0;

    return {
      openPRs: open.slice(0, 20).map((pr) => ({
        id: pr.number,
        title: pr.title,
        url: pr.html_url,
        createdAt: pr.created_at,
        author: pr.user?.login || "Unknown",
        labels: pr.labels?.map((l) => l.name) || [],
        draft: pr.draft || false,
        reviewers:
          pr.requested_reviewers?.map((r) => r.login) || []
      })),
      closedPRs: closed.slice(0, 20).map((pr) => ({
        id: pr.number,
        title: pr.title,
        url: pr.html_url,
        createdAt: pr.created_at,
        closedAt: pr.closed_at,
        mergedAt: pr.merged_at,
        author: pr.user?.login || "Unknown",
        merged: pr.merged_at !== null
      })),
      totalOpen: open.length,
      totalClosed: closed.length,
      totalMerged: merged.length,
      totalPRs: allPRs.length,
      mergeRate:
        allPRs.length > 0
          ? parseFloat(
              ((merged.length / allPRs.length) * 100).toFixed(2)
            )
          : 0,
      avgMergeTimeDays: parseFloat(avgMergeTime.toFixed(2)),
      prHealth:
        open.length === 0
          ? "Excellent"
          : open.length < 5
          ? "Good"
          : open.length < 20
          ? "Fair"
          : "Needs Attention"
    };
  } catch (error) {
    throw new Error(`Failed to fetch pull requests: ${error.message}`);
  }
};