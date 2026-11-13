const { githubRequestSafe } = require("../utils/githubApi");

/**
 * Analyze an entire organization or user portfolio
 */
exports.getOrganizationPortfolio = async (orgName) => {
  if (!orgName || typeof orgName !== "string") {
    throw new Error("Organization name is required");
  }

  const cleanOrg = orgName.trim().toLowerCase();

  // 1. Fetch organization info (fallback to user if org 404s)
  let orgData = await githubRequestSafe(`/orgs/${cleanOrg}`);
  let isUserFallback = false;

  if (!orgData) {
    orgData = await githubRequestSafe(`/users/${cleanOrg}`);
    isUserFallback = true;
  }

  if (!orgData) {
    throw new Error(`Organization or account "${cleanOrg}" not found on GitHub.`);
  }

  // 2. Fetch up to 100 repos sorted by pushed date
  const endpoint = isUserFallback
    ? `/users/${cleanOrg}/repos?per_page=100&sort=pushed&direction=desc`
    : `/orgs/${cleanOrg}/repos?per_page=100&sort=pushed&direction=desc`;

  const reposList = (await githubRequestSafe(endpoint)) || [];

  if (reposList.length === 0) {
    // If empty or private, try standard request or empty portfolio
    return {
      organization: {
        login: orgData.login,
        name: orgData.name || orgData.login,
        avatar: orgData.avatar_url,
        description: orgData.description || orgData.bio || "",
        url: orgData.html_url,
        type: orgData.type || "Organization",
        blog: orgData.blog || null,
        location: orgData.location || null,
        createdAt: orgData.created_at
      },
      stats: {
        totalRepos: 0,
        totalStars: 0,
        totalForks: 0,
        totalOpenIssues: 0,
        healthGrade: "N/A",
        healthScore: 0
      },
      languages: [],
      topRepos: [],
      staleRepos: [],
      allRepos: []
    };
  }

  // 3. Compute aggregate metrics
  let totalStars = 0;
  let totalForks = 0;
  let totalOpenIssues = 0;
  let totalWatchers = 0;
  let archivedCount = 0;
  let activeWithin30DaysCount = 0;
  let staleCount = 0;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const languageMap = new Map();

  const formattedRepos = reposList.map((r) => {
    const stars = r.stargazers_count || 0;
    const forks = r.forks_count || 0;
    const issues = r.open_issues_count || 0;
    const watchers = r.watchers_count || 0;
    const pushed = r.pushed_at ? new Date(r.pushed_at) : null;
    const isArchived = Boolean(r.archived);

    totalStars += stars;
    totalForks += forks;
    totalOpenIssues += issues;
    totalWatchers += watchers;

    if (isArchived) archivedCount++;
    if (pushed && pushed >= thirtyDaysAgo) activeWithin30DaysCount++;

    let status = "active";
    if (isArchived) {
      status = "archived";
    } else if (pushed && pushed < sixMonthsAgo && issues > 5) {
      status = "stale";
      staleCount++;
    }

    if (r.language) {
      languageMap.set(r.language, (languageMap.get(r.language) || 0) + 1);
    }

    return {
      name: r.name,
      fullName: r.full_name,
      description: r.description || "",
      stars,
      forks,
      openIssues: issues,
      watchers,
      language: r.language || "Unknown",
      isArchived,
      isFork: Boolean(r.fork),
      status,
      createdAt: r.created_at,
      pushedAt: r.pushed_at,
      url: r.html_url
    };
  });

  // Sort by stars descending for top repos
  formattedRepos.sort((a, b) => b.stars - a.stars);

  // Top 5 powerhouses
  const topRepos = formattedRepos.slice(0, 5);

  // Stale / At-Risk repos
  const staleRepos = formattedRepos.filter((r) => r.status === "stale").slice(0, 8);

  // Language breakdown
  const totalWithLang = Array.from(languageMap.values()).reduce((a, b) => a + b, 0);
  const languages = Array.from(languageMap.entries())
    .map(([lang, count]) => ({
      name: lang,
      count,
      percentage: totalWithLang > 0 ? Math.round((count / totalWithLang) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Compute Organization Portfolio Health Score (0 - 100)
  // Factors: active maintenance ratio, issue load, archive hygiene
  const activeRatio = reposList.length > 0 ? (activeWithin30DaysCount / reposList.length) : 0;
  const stalePenalty = reposList.length > 0 ? (staleCount / reposList.length) * 30 : 0;
  const archivePenalty = reposList.length > 0 ? (archivedCount / reposList.length) * 15 : 0;

  let rawHealth = Math.round(50 + (activeRatio * 50) - stalePenalty - archivePenalty);
  if (totalStars > 1000) rawHealth += 10;
  const healthScore = Math.max(25, Math.min(98, rawHealth));

  let healthGrade = "B";
  if (healthScore >= 90) healthGrade = "A+";
  else if (healthScore >= 80) healthGrade = "A";
  else if (healthScore >= 70) healthGrade = "B";
  else if (healthScore >= 55) healthGrade = "C";
  else healthGrade = "D";

  return {
    organization: {
      login: orgData.login,
      name: orgData.name || orgData.login,
      avatar: orgData.avatar_url,
      description: orgData.description || orgData.bio || "",
      url: orgData.html_url,
      type: orgData.type || (isUserFallback ? "User" : "Organization"),
      blog: orgData.blog || null,
      location: orgData.location || null,
      publicReposCount: orgData.public_repos || reposList.length,
      followers: orgData.followers || 0,
      createdAt: orgData.created_at
    },
    stats: {
      totalRepos: reposList.length,
      totalStars,
      totalForks,
      totalOpenIssues,
      totalWatchers,
      avgStarsPerRepo: reposList.length > 0 ? Math.round(totalStars / reposList.length) : 0,
      activeRepos30d: activeWithin30DaysCount,
      staleReposCount: staleCount,
      archivedReposCount: archivedCount,
      healthScore,
      healthGrade
    },
    languages,
    topRepos,
    staleRepos,
    allRepos: formattedRepos
  };
};
