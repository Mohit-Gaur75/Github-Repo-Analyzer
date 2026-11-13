const { githubRequest } = require("../utils/githubApi");

// Curated fallback repositories if GitHub API encounters rate limit or network issue
const CURATED_FALLBACK = [
  {
    fullName: "facebook/react",
    owner: { login: "facebook", avatar: "https://avatars.githubusercontent.com/u/69631" },
    name: "react",
    description: "The library for web and native user interfaces.",
    url: "https://github.com/facebook/react",
    stars: 228000,
    forks: 46200,
    openIssues: 1200,
    language: "JavaScript",
    topics: ["declarative", "frontend", "javascript", "react", "ui"],
    pushedAt: new Date().toISOString()
  },
  {
    fullName: "microsoft/vscode",
    owner: { login: "microsoft", avatar: "https://avatars.githubusercontent.com/u/6154722" },
    name: "vscode",
    description: "Visual Studio Code is a code editor redefined and optimized for building and debugging modern web and cloud applications.",
    url: "https://github.com/microsoft/vscode",
    stars: 162500,
    forks: 30500,
    openIssues: 5400,
    language: "TypeScript",
    topics: ["electron", "editor", "typescript", "developer-tools"],
    pushedAt: new Date().toISOString()
  },
  {
    fullName: "torvalds/linux",
    owner: { login: "torvalds", avatar: "https://avatars.githubusercontent.com/u/1024025" },
    name: "linux",
    description: "Linux kernel source tree.",
    url: "https://github.com/torvalds/linux",
    stars: 181000,
    forks: 54300,
    openIssues: 420,
    language: "C",
    topics: ["kernel", "os", "linux", "c"],
    pushedAt: new Date().toISOString()
  },
  {
    fullName: "vllm-project/vllm",
    owner: { login: "vllm-project", avatar: "https://avatars.githubusercontent.com/u/137798319" },
    name: "vllm",
    description: "A high-throughput and memory-efficient inference and serving engine for LLMs.",
    url: "https://github.com/vllm-project/vllm",
    stars: 38500,
    forks: 5600,
    openIssues: 820,
    language: "Python",
    topics: ["ai", "llm", "inference", "pytorch"],
    pushedAt: new Date().toISOString()
  },
  {
    fullName: "tailwindlabs/tailwindcss",
    owner: { login: "tailwindlabs", avatar: "https://avatars.githubusercontent.com/u/67104415" },
    name: "tailwindcss",
    description: "A utility-first CSS framework for rapid UI development.",
    url: "https://github.com/tailwindlabs/tailwindcss",
    stars: 84000,
    forks: 4100,
    openIssues: 65,
    language: "TypeScript",
    topics: ["css", "framework", "responsive", "utility-first"],
    pushedAt: new Date().toISOString()
  }
];

/**
 * Build date filter string according to timeframe
 */
function getDateFilter(timeframe) {
  const now = new Date();
  let daysAgo = 7; // default weekly

  if (timeframe === "daily") daysAgo = 1;
  else if (timeframe === "weekly") daysAgo = 7;
  else if (timeframe === "monthly") daysAgo = 30;
  else if (timeframe === "yearly") daysAgo = 365;
  else if (timeframe === "all") return "";

  const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const yyyy = targetDate.getUTCFullYear();
  const mm = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getUTCDate()).padStart(2, "0");

  return `created:>${yyyy}-${mm}-${dd}`;
}

/**
 * Fetch trending repositories from GitHub Search API
 */
exports.getTrendingRepos = async ({
  timeframe = "weekly",
  language = "",
  topic = "",
  query = "",
  sort = "stars",
  order = "desc",
  page = 1,
  perPage = 25
} = {}) => {
  try {
    const queryParts = [];

    // Date range filter
    const dateFilter = getDateFilter(timeframe);
    if (dateFilter) {
      queryParts.push(dateFilter);
    } else {
      queryParts.push("stars:>100");
    }

    // Language filter
    if (language && language.toLowerCase() !== "all") {
      queryParts.push(`language:${encodeURIComponent(language.trim())}`);
    }

    // Topic filter
    if (topic && topic.toLowerCase() !== "all") {
      queryParts.push(`topic:${encodeURIComponent(topic.trim())}`);
    }

    // Custom query keyword
    if (query && query.trim()) {
      queryParts.push(query.trim());
    }

    const q = queryParts.join(" ");
    const searchUrl = `/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&page=${page}&per_page=${perPage}`;

    const res = await githubRequest(searchUrl);

    const items = (res.items || []).map((repo) => ({
      id: repo.id,
      fullName: repo.full_name,
      name: repo.name,
      owner: {
        login: repo.owner?.login || "unknown",
        avatar: repo.owner?.avatar_url || null,
        url: repo.owner?.html_url || null
      },
      description: repo.description || "",
      url: repo.html_url,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      openIssues: repo.open_issues_count || 0,
      language: repo.language || "Unknown",
      topics: repo.topics || [],
      license: repo.license?.spdx_id || repo.license?.name || null,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at
    }));

    return {
      totalCount: res.total_count || items.length,
      timeframe,
      language: language || "all",
      topic: topic || "all",
      query: query || "",
      count: items.length,
      repositories: items
    };
  } catch (error) {
    console.warn(`Trending search failed (${error.message}). Returning fallback curated trending list.`);
    // Return curated fallback filtered by language/topic if requested
    let fallback = CURATED_FALLBACK;
    if (language && language.toLowerCase() !== "all") {
      const match = fallback.filter(
        (r) => r.language.toLowerCase() === language.toLowerCase()
      );
      if (match.length > 0) fallback = match;
    }
    return {
      totalCount: fallback.length,
      timeframe,
      language: language || "all",
      topic: topic || "all",
      query: query || "",
      count: fallback.length,
      repositories: fallback,
      isFallback: true
    };
  }
};
