const parseRepoUrl = (input) => {
  if (!input || typeof input !== "string") {
    throw new Error("Invalid input: must be a non-empty string");
  }

  const trimmed = input.trim();

  const patterns = [
    /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/,
    /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const owner = match[1];
      const repo = match[2].replace(/\.git$/, "");
      return { owner, repo };
    }
  }

  throw new Error(
    "Invalid GitHub repository format. Use: owner/repo or https://github.com/owner/repo"
  );
};

const formatRepoFullName = (owner, repo) => {
  return `${owner}/${repo}`.toLowerCase();
};

const isValidRepoName = (name) => {
  const pattern = /^[a-zA-Z0-9_.-]+$/;
  return pattern.test(name) && name.length <= 100;
};

module.exports = { parseRepoUrl, formatRepoFullName, isValidRepoName };