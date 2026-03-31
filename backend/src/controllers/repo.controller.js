
const {
  getRepoDetails: fetchRepoDetails,
  getRepoAnalysis
} = require("../services/github.service");
const { generateSummary, generateInsights } = require("../services/ai.service");
const Repo = require("../models/Repo");
const Analysis = require("../models/Analysis");

exports.getRepoDetails = async (req, res) => {
  try {
    const { owner, repo } = req.params;

    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        error: "Owner and repo parameters are required"
      });
    }

    const repoData = await fetchRepoDetails(owner, repo);

    const repoDoc = {
      owner: repoData.owner.login.toLowerCase(),
      name: repoData.name.toLowerCase(),
      fullName: repoData.full_name,
      description: repoData.description,
      url: repoData.html_url,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.watchers_count,
      language: repoData.language,
      topics: repoData.topics || [],
      license: repoData.license?.name || null,
      isPrivate: repoData.private,
      isFork: repoData.fork,
      isArchived: repoData.archived,
      defaultBranch: repoData.default_branch,
      openIssuesCount: repoData.open_issues_count,
      owner_info: {
        login: repoData.owner.login,
        avatar: repoData.owner.avatar_url,
        url: repoData.owner.html_url
      },
      createdAt_github: repoData.created_at,
      updatedAt_github: repoData.updated_at,
      lastAnalyzed: new Date()
    };

    await Repo.findOneAndUpdate(
      { fullName: repoData.full_name },
      repoDoc,
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: {
        id: repoData.id,
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        url: repoData.html_url,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.watchers_count,
        language: repoData.language,
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        pushedAt: repoData.pushed_at,
        size: repoData.size,
        defaultBranch: repoData.default_branch,
        license: repoData.license?.name || null,
        topics: repoData.topics || [],
        visibility: repoData.visibility,
        isPrivate: repoData.private,
        isFork: repoData.fork,
        isArchived: repoData.archived,
        hasIssues: repoData.has_issues,
        openIssuesCount: repoData.open_issues_count,
        owner: {
          login: repoData.owner.login,
          id: repoData.owner.id,
          avatar: repoData.owner.avatar_url,
          url: repoData.owner.html_url
        }
      }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: "Repository not found or GitHub API error",
      message: error.message
    });
  }
};

exports.validateRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({
        success: false,
        error: "Repository URL is required"
      });
    }

    const match = repoUrl.match(
      /github\.com\/([^\\/]+)\/([^\\/]+)/
    );
    const shortMatch = repoUrl.match(/^([^\\/]+)\/([^\\/]+)$/);
    const result = match || shortMatch;

    if (!result) {
      return res.status(400).json({
        success: false,
        error: "Invalid GitHub repository URL"
      });
    }

    const owner = result[1];
    const repo = result[2].replace(".git", "");

    const repoData = await fetchRepoDetails(owner, repo);

    res.json({
      success: true,
      data: {
        owner,
        repo,
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        language: repoData.language,
        updatedAt: repoData.updated_at
      }
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: "Repository not found or GitHub API error"
    });
  }
};

exports.getFullAnalysis = async (req, res) => {
  try {
    const { owner, repo } = req.params;

    const analysisData = await getRepoAnalysis(owner, repo);

    const summary = generateSummary(
      {
        name: analysisData.repository.name,
        description: analysisData.repository.description,
        stars: analysisData.repository.stargazers_count,
        forks: analysisData.repository.forks_count,
        language: analysisData.repository.language,
        createdAt: analysisData.repository.created_at,
        updatedAt: analysisData.repository.updated_at
      },
      analysisData
    );

    const insights = generateInsights(analysisData);

    await Analysis.findOneAndUpdate(
      { repoFullName: `${owner}/${repo}` },
      {
        repoFullName: `${owner}/${repo}`,
        owner,
        repo,
        languages: analysisData.languages,
        commits: analysisData.commits,
        contributors: analysisData.contributors,
        issues: analysisData.issues,
        pullRequests: analysisData.pullRequests,
        analyzedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: {
        ...analysisData,
        summary,
        insights
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch full analysis",
      message: error.message
    });
  }
};

exports.getRecentRepos = async (req, res) => {
  try {
    const repos = await Repo.find()
      .sort({ lastAnalyzed: -1 })
      .limit(10)
      .select(
        "fullName description stars language lastAnalyzed owner_info"
      );

    res.json({
      success: true,
      data: repos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent repositories"
    });
  }
};