import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    // Include API key header if configured (required in production when validateApiKey is active)
    ...(import.meta.env.VITE_API_KEY
      ? { "X-API-Key": import.meta.env.VITE_API_KEY }
      : {})
  }
});

API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export const validateRepository = (repoUrl) =>
  API.post("/repo/validate", { repoUrl });

export const getRepoDetails = (owner, repo) =>
  API.get(`/repo/${owner}/${repo}`);

export const getRecentRepos = () =>
  API.get("/repo/recent");

export const getFullAnalysis = (owner, repo) =>
  API.get(`/repo/analysis/${owner}/${repo}`);

export const getLanguages = (owner, repo) =>
  API.get(`/languages/${owner}/${repo}`);

export const getCommits = (owner, repo) =>
  API.get(`/commits/${owner}/${repo}`);

export const getContributors = (owner, repo) =>
  API.get(`/contributors/${owner}/${repo}`);

export const getIssues = (owner, repo) =>
  API.get(`/issues/${owner}/${repo}`);

export const getPullRequests = (owner, repo) =>
  API.get(`/prs/${owner}/${repo}`);

export const getQuality = (owner, repo) =>
  API.get(`/quality/${owner}/${repo}`);

export const getSecurity = (owner, repo) =>
  API.get(`/security/${owner}/${repo}`);

export const getCVEScan = (owner, repo) =>
  API.get(`/security/${owner}/${repo}/cve`);

export const getAIInsights = (owner, repo) =>
  API.get(`/ai/${owner}/${repo}`);

export const getActivity = (owner, repo, perPage = 30) =>
  API.get(`/activity/${owner}/${repo}?per_page=${perPage}`);

export const compareRepositories = (owner1, repo1, owner2, repo2) =>
  API.get(`/compare/${owner1}/${repo1}/${owner2}/${repo2}`);

export const getUserProfile = (username) =>
  API.get(`/user/${username}`);

export const getRepoTrend = (owner, repo) =>
  API.get(`/trend/${owner}/${repo}`);

export const getTechStack = (owner, repo) =>
  API.get(`/techstack/${owner}/${repo}`);

export const getReleases = (owner, repo) =>
  API.get(`/releases/${owner}/${repo}`);

export const getExecutiveReport = (owner, repo) =>
  API.get(`/report/${owner}/${repo}`);

// Returns the SSE URL — used directly with EventSource (not axios)
export const getActivityStreamUrl = (owner, repo) => {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
  return `${base}/activity/${owner}/${repo}/stream`;
};

export const getTrendingRepos = (params = {}) =>
  API.get("/discovery/trending", { params });

export const getCodeComplexity = (owner, repo) =>
  API.get(`/complexity/${owner}/${repo}`);

export const getSBOM = (owner, repo) =>
  API.get(`/sbom/${owner}/${repo}`);

export const getSBOMDownloadUrl = (owner, repo, format = "spdx") => {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
  return `${base}/sbom/${owner}/${repo}/${format}`;
};

export const getBadgeSnippets = (owner, repo) =>
  API.get(`/badge/${owner}/${repo}`);

export const getBadgeSvgUrl = (owner, repo, metric, style = "flat") => {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
  return `${base}/badge/${owner}/${repo}/${metric}?style=${style}`;
};
