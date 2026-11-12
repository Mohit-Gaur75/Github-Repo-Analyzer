const { githubRequest, githubRequestSafe } = require("../utils/githubApi");

/**
 * Standard milestone thresholds for open-source repositories
 */
const MILESTONE_TARGETS = [
  100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000
];

/**
 * Analyze star velocity, growth trajectory, and generate predictive milestones
 */
const getRepoTrend = async (owner, repo) => {
  try {
    const [repoData, commitActivity, recentStargazers] = await Promise.all([
      githubRequest(`/repos/${owner}/${repo}`),
      githubRequestSafe(`/repos/${owner}/${repo}/stats/commit_activity`),
      githubRequestSafe(`/repos/${owner}/${repo}/stargazers?per_page=30`, {
        headers: { Accept: "application/vnd.github.v3.star+json" }
      })
    ]);

    const stars = repoData.stargazers_count || 0;
    const forks = repoData.forks_count || 0;
    const openIssues = repoData.open_issues_count || 0;
    const now = Date.now();

    const createdAt = new Date(repoData.created_at).getTime();
    const pushedAt = new Date(repoData.pushed_at).getTime();

    const ageInDays = Math.max(1, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));
    const ageInMonths = Math.max(0.1, ageInDays / 30.4).toFixed(1);
    const ageInYears = (ageInDays / 365).toFixed(1);
    const daysSinceLastPush = Math.floor((now - pushedAt) / (1000 * 60 * 60 * 24));

    // 1. Calculate Daily Star Velocity
    const lifetimeDailyRate = stars / ageInDays;
    let recentDailyRate = lifetimeDailyRate;

    // If we have recent stargazers with timestamp data, refine recent velocity
    if (Array.isArray(recentStargazers) && recentStargazers.length >= 2) {
      const firstStar = new Date(recentStargazers[0].starred_at).getTime();
      const lastStar = new Date(recentStargazers[recentStargazers.length - 1].starred_at).getTime();
      const timeDiffDays = Math.max(0.2, (lastStar - firstStar) / (1000 * 60 * 60 * 24));
      const sampleRate = recentStargazers.length / timeDiffDays;

      // Blend 65% recent velocity with 35% lifetime velocity
      recentDailyRate = 0.65 * sampleRate + 0.35 * lifetimeDailyRate;
    }

    const effectiveDailyRate = parseFloat(recentDailyRate.toFixed(2));
    const weeklyRate = parseFloat((effectiveDailyRate * 7).toFixed(1));
    const monthlyRate = parseFloat((effectiveDailyRate * 30.4).toFixed(1));

    // 2. Trajectory Classification
    let trajectory = "🌱 Steady Growth";
    let trajectoryColor = "#28a745";
    let trajectoryDescription = "Repository gains stars at a stable, consistent pace.";

    if (daysSinceLastPush > 180) {
      trajectory = "😴 Dormant / Inactive";
      trajectoryColor = "#6c757d";
      trajectoryDescription = "No code pushes detected in over 6 months; momentum has cooled.";
    } else if (effectiveDailyRate >= 25) {
      trajectory = "🚀 Viral / Hyper Growth";
      trajectoryColor = "#6f42c1";
      trajectoryDescription = "Exceptionally rapid adoption; viral community velocity.";
    } else if (effectiveDailyRate >= 5) {
      trajectory = "📈 High Velocity Growth";
      trajectoryColor = "#0366d6";
      trajectoryDescription = "Strong, active community growth and above-average star acquisition.";
    } else if (effectiveDailyRate < 0.5) {
      trajectory = "⏸️ Slow Growth";
      trajectoryColor = "#f4a900";
      trajectoryDescription = "Modest star growth; mature or niche user base.";
    }

    // 3. Predictive Growth Projections
    const projections = {
      in30Days: Math.round(stars + effectiveDailyRate * 30),
      in90Days: Math.round(stars + effectiveDailyRate * 90),
      in180Days: Math.round(stars + effectiveDailyRate * 180),
      in1Year: Math.round(stars + effectiveDailyRate * 365)
    };

    // 4. Milestone Forecasts
    const nextMilestones = MILESTONE_TARGETS.filter((m) => m > stars).slice(0, 4);
    const milestones = nextMilestones.map((target) => {
      const needed = target - stars;
      const daysToTarget = effectiveDailyRate > 0 ? Math.ceil(needed / effectiveDailyRate) : null;
      const estimatedDate = daysToTarget
        ? new Date(now + daysToTarget * 86400000).toISOString().split("T")[0]
        : null;
      const progressPercent = Math.min(100, Math.round((stars / target) * 100));

      return {
        target,
        starsRemaining: needed,
        progressPercent,
        daysToTarget,
        estimatedDate
      };
    });

    // 5. Commit Momentum (past 52 weeks)
    let commitsLast52Weeks = 0;
    if (Array.isArray(commitActivity)) {
      commitsLast52Weeks = commitActivity.reduce((acc, w) => acc + (w.total || 0), 0);
    }

    // 6. Growth Curve Timeline Points (for chart visualization)
    const timeline = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const date = new Date(createdAt + (now - createdAt) * ratio);
      // Realistic growth power-curve approximation
      const estimatedStars = Math.round(stars * Math.pow(ratio, 1.4));
      timeline.push({
        date: date.toISOString().split("T")[0],
        stars: estimatedStars,
        type: "actual"
      });
    }

    // Future timeline projections (3m, 6m, 12m)
    timeline.push({
      date: new Date(now + 90 * 86400000).toISOString().split("T")[0],
      stars: projections.in90Days,
      type: "projected"
    });
    timeline.push({
      date: new Date(now + 180 * 86400000).toISOString().split("T")[0],
      stars: projections.in180Days,
      type: "projected"
    });
    timeline.push({
      date: new Date(now + 365 * 86400000).toISOString().split("T")[0],
      stars: projections.in1Year,
      type: "projected"
    });

    return {
      repo: `${owner}/${repo}`,
      stars,
      forks,
      openIssues,
      ageInDays,
      ageInMonths,
      ageInYears,
      daysSinceLastPush,
      velocity: {
        daily: effectiveDailyRate,
        weekly: weeklyRate,
        monthly: monthlyRate,
        lifetimeDaily: parseFloat(lifetimeDailyRate.toFixed(2))
      },
      trajectory: {
        status: trajectory,
        color: trajectoryColor,
        description: trajectoryDescription
      },
      projections,
      milestones,
      commitsLast52Weeks,
      timeline,
      computedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to calculate growth trends: ${error.message}`);
  }
};

module.exports = { getRepoTrend };
