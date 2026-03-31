const { githubRequestSafe } = require("../utils/githubApi");

exports.getIssues = async (owner, repo) => {
  try {
    const [openIssues, closedIssues] = await Promise.all([
      githubRequestSafe(
        `/repos/${owner}/${repo}/issues?state=open&per_page=100`
      ),
      githubRequestSafe(
        `/repos/${owner}/${repo}/issues?state=closed&per_page=100`
      )
    ]);

    const open = (openIssues || []).filter((i) => !i.pull_request);
    const closed = (closedIssues || []).filter((i) => !i.pull_request);

    const allIssues = [...open, ...closed];

    const labels = {};
    allIssues.forEach((issue) => {
      (issue.labels || []).forEach((label) => {
        labels[label.name] = (labels[label.name] || 0) + 1;
      });
    });

    const avgCloseTime =
      closed.length > 0
        ? closed.reduce((sum, issue) => {
            const created = new Date(issue.created_at);
            const closedAt = new Date(issue.closed_at);
            return sum + (closedAt - created) / (1000 * 60 * 60 * 24);
          }, 0) / closed.length
        : 0;

    return {
      openIssues: open.slice(0, 20).map((issue) => ({
        id: issue.number,
        title: issue.title,
        url: issue.html_url,
        createdAt: issue.created_at,
        labels: issue.labels?.map((l) => l.name) || [],
        author: issue.user?.login || "Unknown",
        comments: issue.comments || 0
      })),
      closedIssues: closed.slice(0, 20).map((issue) => ({
        id: issue.number,
        title: issue.title,
        url: issue.html_url,
        createdAt: issue.created_at,
        closedAt: issue.closed_at,
        labels: issue.labels?.map((l) => l.name) || [],
        author: issue.user?.login || "Unknown"
      })),
      totalOpen: open.length,
      totalClosed: closed.length,
      totalIssues: allIssues.length,
      closeRate:
        allIssues.length > 0
          ? parseFloat(
              ((closed.length / allIssues.length) * 100).toFixed(2)
            )
          : 0,
      avgCloseTimeDays: parseFloat(avgCloseTime.toFixed(2)),
      labelDistribution: labels,
      issueHealth:
        open.length === 0
          ? "Excellent"
          : open.length < 10
          ? "Good"
          : open.length < 50
          ? "Fair"
          : "Needs Attention"
    };
  } catch (error) {
    throw new Error(`Failed to fetch issues: ${error.message}`);
  }
};