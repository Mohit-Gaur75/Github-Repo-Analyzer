const { githubRequest, githubRequestSafe } = require("../utils/githubApi");
const { calculateHealthScore } = require("../utils/healthScore");

/**
 * Gather a concise but rich metric profile for a single repo
 */
const getRepoProfile = async (owner, repo) => {
  const [repoData, languages, contributors, issuesOpen, issuesClosed, prs, workflows] =
    await Promise.all([
      githubRequest(`/repos/${owner}/${repo}`),
      githubRequestSafe(`/repos/${owner}/${repo}/languages`),
      githubRequestSafe(`/repos/${owner}/${repo}/contributors?per_page=100`),
      githubRequestSafe(`/repos/${owner}/${repo}/issues?state=open&per_page=100`),
      githubRequestSafe(`/repos/${owner}/${repo}/issues?state=closed&per_page=100`),
      githubRequestSafe(`/repos/${owner}/${repo}/pulls?state=all&per_page=100`),
      githubRequestSafe(`/repos/${owner}/${repo}/actions/workflows`)
    ]);

  const rawIssuesOpen = (issuesOpen || []).filter((i) => !i.pull_request);
  const rawIssuesClosed = (issuesClosed || []).filter((i) => !i.pull_request);
  const totalIssues = rawIssuesOpen.length + rawIssuesClosed.length;
  const issueCloseRate = totalIssues > 0
    ? Math.round((rawIssuesClosed.length / totalIssues) * 100)
    : 0;

  const pullRequests = prs || [];
  const mergedPRs = pullRequests.filter((p) => p.merged_at);
  const prMergeRate = pullRequests.length > 0
    ? Math.round((mergedPRs.length / pullRequests.length) * 100)
    : 0;

  const totalContributors = (contributors || []).length;
  const topContributorRatio = totalContributors > 0 && contributors[0]
    ? Math.round((contributors[0].contributions /
        contributors.reduce((acc, c) => acc + (c.contributions || 0), 0)) * 100)
    : 0;

  const health = calculateHealthScore(repoData);

  const langObj = languages || {};
  const totalBytes = Object.values(langObj).reduce((sum, b) => sum + b, 0);
  const languageList = Object.entries(langObj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : 0
    }));

  const ageInDays = Math.floor(
    (Date.now() - new Date(repoData.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    fullName: repoData.full_name,
    name: repoData.name,
    owner: {
      login: repoData.owner.login,
      avatar: repoData.owner.avatar_url,
      url: repoData.owner.html_url
    },
    description: repoData.description,
    url: repoData.html_url,
    license: repoData.license?.spdx_id || repoData.license?.name || "None",
    primaryLanguage: repoData.language || "Unknown",
    languages: languageList,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    watchers: repoData.watchers_count,
    openIssues: repoData.open_issues_count,
    closedIssues: rawIssuesClosed.length,
    issueCloseRate,
    pullRequestsCount: pullRequests.length,
    prMergeRate,
    totalContributors,
    topContributorRatio,
    healthScore: health.score,
    healthGrade: health.grade,
    hasCICD: (workflows?.total_count || 0) > 0,
    isArchived: repoData.archived,
    sizeMB: parseFloat((repoData.size / 1024).toFixed(1)),
    createdAt: repoData.created_at,
    updatedAt: repoData.updated_at,
    pushedAt: repoData.pushed_at,
    ageInDays,
    ageFormatted: (ageInDays / 365).toFixed(1) + " yrs"
  };
};

/**
 * Compare two repos and determine metric winners + overall verdict
 */
const compareRepositories = async (owner1, repo1, owner2, repo2) => {
  const [profile1, profile2] = await Promise.all([
    getRepoProfile(owner1, repo1),
    getRepoProfile(owner2, repo2)
  ]);

  const compareMetric = (val1, val2, higherIsBetter = true) => {
    if (val1 === val2) return "tie";
    if (higherIsBetter) {
      return val1 > val2 ? "repo1" : "repo2";
    }
    return val1 < val2 ? "repo1" : "repo2";
  };

  const metrics = [
    {
      key: "stars",
      label: "GitHub Stars",
      val1: profile1.stars,
      val2: profile2.stars,
      winner: compareMetric(profile1.stars, profile2.stars, true),
      type: "number"
    },
    {
      key: "forks",
      label: "Forks",
      val1: profile1.forks,
      val2: profile2.forks,
      winner: compareMetric(profile1.forks, profile2.forks, true),
      type: "number"
    },
    {
      key: "healthScore",
      label: "Health Score",
      val1: profile1.healthScore,
      val2: profile2.healthScore,
      winner: compareMetric(profile1.healthScore, profile2.healthScore, true),
      type: "percentage"
    },
    {
      key: "issueCloseRate",
      label: "Issue Close Rate",
      val1: profile1.issueCloseRate,
      val2: profile2.issueCloseRate,
      winner: compareMetric(profile1.issueCloseRate, profile2.issueCloseRate, true),
      type: "percentage"
    },
    {
      key: "prMergeRate",
      label: "PR Merge Rate",
      val1: profile1.prMergeRate,
      val2: profile2.prMergeRate,
      winner: compareMetric(profile1.prMergeRate, profile2.prMergeRate, true),
      type: "percentage"
    },
    {
      key: "totalContributors",
      label: "Contributors (top 100 sample)",
      val1: profile1.totalContributors,
      val2: profile2.totalContributors,
      winner: compareMetric(profile1.totalContributors, profile2.totalContributors, true),
      type: "number"
    },
    {
      key: "recentPush",
      label: "Most Recently Updated",
      val1: new Date(profile1.pushedAt).toLocaleDateString(),
      val2: new Date(profile2.pushedAt).toLocaleDateString(),
      winner: compareMetric(
        new Date(profile1.pushedAt).getTime(),
        new Date(profile2.pushedAt).getTime(),
        true
      ),
      type: "text"
    },
    {
      key: "sizeMB",
      label: "Repository Size (Lighter)",
      val1: `${profile1.sizeMB} MB`,
      val2: `${profile2.sizeMB} MB`,
      winner: compareMetric(profile1.sizeMB, profile2.sizeMB, false), // smaller is lighter
      type: "text"
    }
  ];

  let wins1 = 0;
  let wins2 = 0;
  metrics.forEach((m) => {
    if (m.winner === "repo1") wins1++;
    if (m.winner === "repo2") wins2++;
  });

  const overallWinner =
    wins1 > wins2 ? "repo1" : wins2 > wins1 ? "repo2" : "tie";

  return {
    repo1: profile1,
    repo2: profile2,
    metrics,
    tally: {
      repo1Wins: wins1,
      repo2Wins: wins2,
      overallWinner
    },
    comparedAt: new Date().toISOString()
  };
};

module.exports = { compareRepositories };
