const calculateHealthScore = (repoData) => {
  let score = 0;
  const breakdown = {};

  if (repoData.description) {
    score += 10;
    breakdown.description = 10;
  } else {
    breakdown.description = 0;
  }

  
  if (repoData.license) {
    score += 15;
    breakdown.license = 15;
  } else {
    breakdown.license = 0;
  }

  if (repoData.topics && repoData.topics.length > 0) {
    score += 10;
    breakdown.topics = 10;
  } else {
    breakdown.topics = 0;
  }

  
  const stars = repoData.stars || repoData.stargazers_count || 0;
  const starScore = Math.min(20, Math.floor(stars / 100) * 2);
  score += starScore;
  breakdown.stars = starScore;

  
  const forks = repoData.forks || repoData.forks_count || 0;
  const forkScore = Math.min(15, Math.floor(forks / 50) * 3);
  score += forkScore;
  breakdown.forks = forkScore;

 
  const updatedAt = new Date(repoData.updatedAt || repoData.updated_at);
  const daysSinceUpdate = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 30) {
    score += 15;
    breakdown.recentlyUpdated = 15;
  } else if (daysSinceUpdate < 90) {
    score += 10;
    breakdown.recentlyUpdated = 10;
  } else if (daysSinceUpdate < 365) {
    score += 5;
    breakdown.recentlyUpdated = 5;
  } else {
    breakdown.recentlyUpdated = 0;
  }

  
  if (!repoData.isArchived && !repoData.archived) {
    score += 10;
    breakdown.notArchived = 10;
  } else {
    breakdown.notArchived = 0;
  }

  const openIssues = repoData.openIssuesCount || repoData.open_issues_count || 0;
  if (openIssues > 0 && openIssues < 100) {
    score += 5;
    breakdown.issueActivity = 5;
  } else {
    breakdown.issueActivity = 0;
  }

  return {
    score: Math.min(100, score),
    breakdown,
    grade:
      score >= 80
        ? "A"
        : score >= 60
        ? "B"
        : score >= 40
        ? "C"
        : score >= 20
        ? "D"
        : "F"
  };
};

module.exports = { calculateHealthScore };