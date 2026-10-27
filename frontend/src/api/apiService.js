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
