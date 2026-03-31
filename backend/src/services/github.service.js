const { githubRequest, githubRequestSafe } = require("../utils/githubApi");

const GITHUB_BASE_URL = "https://api.github.com";

exports.getRepoDetails = async (owner, repo) => {
  try {
    const data = await githubRequest(`/repos/${owner}/${repo}`);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch repository details: ${error.message}`);
  }
};

exports.getRepoAnalysis = async (owner, repo) => {
  try {
    const [
      repoData,
      languages,
      commits,
      contributors,
      issues,
      prs,
      deployments,
      forks
    ] = await Promise.all([
      githubRequest(`/repos/${owner}/${repo}`),
      githubRequestSafe(`/repos/${owner}/${repo}/languages`),
      githubRequestSafe(`/repos/${owner}/${repo}/stats/commit_activity`),
      githubRequestSafe(`/repos/${owner}/${repo}/contributors?per_page=100`),
      githubRequestSafe(`/repos/${owner}/${repo}/issues?state=all&per_page=100`),
      githubRequestSafe(`/repos/${owner}/${repo}/pulls?state=all&per_page=100`),
      githubRequestSafe(`/repos/${owner}/${repo}/deployments`),
      githubRequestSafe(`/repos/${owner}/${repo}/forks?per_page=100`)
    ]);

    return {
      repository: repoData,
      languages: languages || {},
      commits: commits || [],
      contributors: contributors || [],
      issues: issues || [],
      pullRequests: prs || [],
      deployments: deployments || [],
      forks: forks || []
    };
  } catch (error) {
    throw new Error(`Failed to fetch repository analysis: ${error.message}`);
  }
};

exports.getReadMe = async (owner, repo) => {
  try {
    const data = await githubRequest(`/repos/${owner}/${repo}/readme`, {
      headers: {
        Accept: "application/vnd.github.v3.raw"
      }
    });
    return data;
  } catch (error) {
    return null;
  }
};

exports.getLatestRelease = async (owner, repo) => {
  try {
    const data = await githubRequest(
      `/repos/${owner}/${repo}/releases/latest`
    );
    return data;
  } catch (error) {
    return null;
  }
};

exports.getTopics = async (owner, repo) => {
  try {
    const data = await githubRequest(`/repos/${owner}/${repo}`, {
      headers: {
        Accept: "application/vnd.github.mercy-preview+json"
      }
    });
    return data.topics || [];
  } catch (error) {
    return [];
  }
};