const { githubRequest, githubRequestSafe } = require("../utils/githubApi");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (endpoint, retries = 3, delayMs = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await githubRequest(endpoint);
      // Accept all valid responses (including empty arrays)
      // Only retry if API response is completely missing or null
      if (data !== null && data !== undefined) {
        return data;
      }
      console.log(`Retry ${i + 1}/${retries} for ${endpoint} — GitHub still computing...`);
      await sleep(delayMs);
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retry ${i + 1}/${retries} for ${endpoint} — API error...`);
      await sleep(delayMs);
    }
  }
  return null;
};

exports.getCommits = async (owner, repo) => {
  try {
    const [commitActivity, recentCommits] = await Promise.all([
      fetchWithRetry(
        `/repos/${owner}/${repo}/stats/commit_activity`
      ).catch(() => null),
      githubRequestSafe(
        `/repos/${owner}/${repo}/commits?per_page=30&page=1`
      )
    ]);

    const weeklyActivity = Array.isArray(commitActivity)
      ? commitActivity
      : [];

    const totalCommitsLastYear = weeklyActivity.reduce(
      (sum, week) => sum + (week?.total || 0),
      0
    );

    const monthlyActivity = {};
    weeklyActivity.forEach((week) => {
      if (week?.week) {
        const date = new Date(week.week * 1000);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        monthlyActivity[monthKey] =
          (monthlyActivity[monthKey] || 0) + (week.total || 0);
      }
    });

    const recent = Array.isArray(recentCommits)
      ? recentCommits.map((commit) => ({
          sha: commit?.sha?.substring(0, 7) || "unknown",
          message:
            commit?.commit?.message?.split("\n")[0] || "No message",
          author:
            commit?.commit?.author?.name ||
            commit?.author?.login ||
            "Unknown",
          date: commit?.commit?.author?.date || null,
          url: commit?.html_url || null
        }))
      : [];

    const activeDays = weeklyActivity.reduce((sum, week) => {
      return (
        sum +
        (Array.isArray(week?.days)
          ? week.days.filter((day) => day > 0).length
          : 0)
      );
    }, 0);

    const mostActiveWeek =
      weeklyActivity.length > 0
        ? weeklyActivity.reduce(
            (max, week) =>
              (week?.total || 0) > (max?.total || 0) ? week : max,
            weeklyActivity[0]
          )
        : null;

    return {
      weeklyActivity,
      monthlyActivity,
      recentCommits: recent,
      totalCommitsLastYear,
      averageCommitsPerWeek:
        weeklyActivity.length > 0
          ? parseFloat(
              (totalCommitsLastYear / weeklyActivity.length).toFixed(2)
            )
          : 0,
      activeDays,
      mostActiveWeek,
      dataAvailable: weeklyActivity.length > 0 || recent.length > 0
    };
  } catch (error) {
    console.error("Commit service error:", error.message);
    return {
      weeklyActivity: [],
      monthlyActivity: {},
      recentCommits: [],
      totalCommitsLastYear: 0,
      averageCommitsPerWeek: 0,
      activeDays: 0,
      mostActiveWeek: null,
      dataAvailable: false,
      error: error.message
    };
  }
};