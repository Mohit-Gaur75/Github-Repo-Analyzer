const axios = require("axios");
const githubConfig = require("../config/github");

const GITHUB_BASE_URL = "https://api.github.com";

const githubRequest = async (endpoint, customConfig = {}) => {
  try {
    const response = await axios.get(`${GITHUB_BASE_URL}${endpoint}`, {
      ...githubConfig,
      ...customConfig,
      headers: {
        ...githubConfig.headers,
        ...(customConfig.headers || {})
      }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        throw new Error("Repository not found");
      }
      if (status === 403) {
        throw new Error("GitHub API rate limit exceeded. Try again later.");
      }
      if (status === 401) {
        throw new Error("GitHub API authentication failed");
      }
      throw new Error(`GitHub API error: ${error.response.data.message}`);
    }
    throw new Error(`Network error: ${error.message}`);
  }
};

const githubRequestSafe = async (endpoint, customConfig = {}) => {
  try {
    return await githubRequest(endpoint, customConfig);
  } catch (error) {
    console.warn(`Safe GitHub request failed for ${endpoint}: ${error.message}`);
    return null;
  }
};

module.exports = { githubRequest, githubRequestSafe };