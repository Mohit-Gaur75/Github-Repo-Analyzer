const { githubRequest, githubRequestSafe } = require("../utils/githubApi");
const { formatEvent } = require("./activity.service");

/**
 * Compute developer score (0 - 100) and community title
 */
const calculateDeveloperScore = (userData, repos = [], events = []) => {
  const stars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const followers = userData.followers || 0;
  const publicRepos = userData.public_repos || repos.length;

  const ageInYears = Math.max(
    0.5,
    (Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)
  );

  // Popularity Score (max 40 pts)
  // Stars + Followers influence
  const starPoints = Math.min(25, Math.round(Math.log10(Math.max(1, stars)) * 7));
  const followerPoints = Math.min(15, Math.round(Math.log10(Math.max(1, followers)) * 4.5));
  const popularityScore = starPoints + followerPoints;

  // Productivity & Longevity (max 35 pts)
  const repoPoints = Math.min(20, Math.round(Math.log10(Math.max(1, publicRepos)) * 9));
  const agePoints = Math.min(15, Math.round(ageInYears * 1.8));
  const productivityScore = repoPoints + agePoints;

  // Recent Activity (max 25 pts)
  const eventPoints = Math.min(25, Math.round((events.length / 30) * 25));

  const totalScore = Math.min(100, Math.max(10, popularityScore + productivityScore + eventPoints));

  let badge = "🌱 Active Developer";
  if (totalScore >= 85 || stars > 5000 || followers > 3000) {
    badge = "🏆 Legendary Maintainer";
  } else if (totalScore >= 70 || stars > 1000 || followers > 500) {
    badge = "⭐ Core Contributor";
  } else if (totalScore >= 50 || stars > 100) {
    badge = "🚀 Prolific Builder";
  } else if (totalScore < 30) {
    badge = "🐣 Rising Coder";
  }

  return {
    overallScore: totalScore,
    badge,
    breakdown: {
      popularity: popularityScore,
      productivity: productivityScore,
      activity: eventPoints
    }
  };
};

/**
 * Fetch and analyze complete GitHub user or organization profile
 */
const getUserProfile = async (username) => {
  try {
    const [userData, reposData, eventsData, orgsData] = await Promise.all([
      githubRequest(`/users/${username}`),
      githubRequestSafe(`/users/${username}/repos?per_page=100&sort=updated`),
      githubRequestSafe(`/users/${username}/events/public?per_page=30`),
      githubRequestSafe(`/users/${username}/orgs`)
    ]);

    const repos = Array.isArray(reposData) ? reposData : [];
    const events = Array.isArray(eventsData) ? eventsData : [];
    const orgs = Array.isArray(orgsData) ? orgsData : [];

    const originalRepos = repos.filter((r) => !r.fork);
    const forkedRepos = repos.filter((r) => r.fork);

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
    const totalWatchers = repos.reduce((sum, r) => sum + (r.watchers_count || 0), 0);

    // Language aggregation
    const langMap = {};
    originalRepos.forEach((r) => {
      if (r.language) {
        langMap[r.language] = (langMap[r.language] || 0) + 1;
      }
    });

    const totalWithLang = Object.values(langMap).reduce((a, b) => a + b, 0);
    const topLanguages = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalWithLang > 0 ? Math.round((count / totalWithLang) * 100) : 0
      }));

    // Top 6 repositories sorted by stars
    const topRepos = [...repos]
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, 6)
      .map((r) => ({
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        url: r.html_url,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        isFork: r.fork,
        updatedAt: r.updated_at
      }));

    // Recent activity events
    const recentActivity = events.slice(0, 15).map(formatEvent);

    const score = calculateDeveloperScore(userData, repos, events);

    const ageInDays = Math.floor(
      (Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      profile: {
        username: userData.login,
        name: userData.name || userData.login,
        avatar: userData.avatar_url,
        url: userData.html_url,
        bio: userData.bio,
        company: userData.company,
        location: userData.location,
        blog: userData.blog,
        twitter: userData.twitter_username,
        publicRepos: userData.public_repos,
        publicGists: userData.public_gists,
        followers: userData.followers,
        following: userData.following,
        createdAt: userData.created_at,
        accountAge: (ageInDays / 365).toFixed(1) + " years",
        type: userData.type || "User"
      },
      stats: {
        totalStars,
        totalForks,
        totalWatchers,
        originalReposCount: originalRepos.length,
        forkedReposCount: forkedRepos.length
      },
      score,
      topLanguages,
      topRepos,
      organizations: orgs.slice(0, 8).map((o) => ({
        login: o.login,
        avatar: o.avatar_url,
        description: o.description
      })),
      recentActivity,
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
};

module.exports = { getUserProfile, calculateDeveloperScore };
