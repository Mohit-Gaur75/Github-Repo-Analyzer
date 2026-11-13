const { githubRequestSafe } = require("../utils/githubApi");

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  if (mins < 60) {
    return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
};

const getHealthGrade = (successRate, totalRuns) => {
  if (!totalRuns || totalRuns === 0) return { grade: "N/A", label: "No Runs Found", color: "#6b7280" };
  if (successRate >= 95) return { grade: "A+", label: "Excellent Reliability", color: "#059669" };
  if (successRate >= 90) return { grade: "A", label: "High Reliability", color: "#10b981" };
  if (successRate >= 80) return { grade: "B", label: "Good Stability", color: "#2563eb" };
  if (successRate >= 70) return { grade: "C", label: "Moderate Flakiness", color: "#d97706" };
  return { grade: "D", label: "High Build Failure Rate", color: "#dc2626" };
};

exports.getCIHealth = async (owner, repo) => {
  try {
    // 1. Fetch GitHub Actions workflows and recent runs in parallel
    const [workflowsRes, runsRes, workflowsDir, circleciConfig, travisConfig, jenkinsConfig, gitlabConfig] = await Promise.all([
      githubRequestSafe(`/repos/${owner}/${repo}/actions/workflows`),
      githubRequestSafe(`/repos/${owner}/${repo}/actions/runs?per_page=50&page=1`),
      githubRequestSafe(`/repos/${owner}/${repo}/contents/.github/workflows`),
      githubRequestSafe(`/repos/${owner}/${repo}/contents/.circleci/config.yml`),
      githubRequestSafe(`/repos/${owner}/${repo}/contents/.travis.yml`),
      githubRequestSafe(`/repos/${owner}/${repo}/contents/Jenkinsfile`),
      githubRequestSafe(`/repos/${owner}/${repo}/contents/.gitlab-ci.yml`)
    ]);

    // 2. Identify all detected CI/CD providers
    const detectedProviders = [];
    const hasGitHubActions =
      (workflowsRes?.total_count && workflowsRes.total_count > 0) ||
      (runsRes?.total_count && runsRes.total_count > 0) ||
      (Array.isArray(workflowsDir) && workflowsDir.length > 0);

    if (hasGitHubActions) {
      detectedProviders.push({
        name: "GitHub Actions",
        type: "builtin",
        icon: "🔄",
        status: "Active"
      });
    }
    if (circleciConfig) {
      detectedProviders.push({
        name: "CircleCI",
        type: "third-party",
        icon: "⭕",
        status: "Configured"
      });
    }
    if (travisConfig) {
      detectedProviders.push({
        name: "Travis CI",
        type: "third-party",
        icon: "👷",
        status: "Configured"
      });
    }
    if (jenkinsConfig) {
      detectedProviders.push({
        name: "Jenkins",
        type: "self-hosted",
        icon: "🤵",
        status: "Configured"
      });
    }
    if (gitlabConfig) {
      detectedProviders.push({
        name: "GitLab CI",
        type: "third-party",
        icon: "🦊",
        status: "Configured"
      });
    }

    // 3. Process raw runs from GitHub Actions
    const rawRuns = Array.isArray(runsRes?.workflow_runs) ? runsRes.workflow_runs : [];
    const totalRunsAnalyzed = rawRuns.length;

    const formattedRuns = rawRuns.map((run) => {
      let durationSeconds = 0;
      if (run.run_started_at && run.updated_at) {
        const start = new Date(run.run_started_at).getTime();
        const end = new Date(run.updated_at).getTime();
        if (end >= start) {
          durationSeconds = Math.round((end - start) / 1000);
        }
      }

      return {
        id: run.id,
        name: run.name || "Workflow Run",
        workflowId: run.workflow_id,
        status: run.status, // "completed", "in_progress", "queued"
        conclusion: run.conclusion || run.status, // "success", "failure", "cancelled", etc.
        event: run.event, // "push", "pull_request", "schedule", etc.
        branch: run.head_branch || "unknown",
        commitSha: run.head_sha ? run.head_sha.substring(0, 7) : "",
        commitMessage: run.head_commit?.message?.split("\n")[0] || "No commit message",
        actor: {
          login: run.actor?.login || "github-actions[bot]",
          avatarUrl: run.actor?.avatar_url || null
        },
        durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        createdAt: run.created_at,
        updatedAt: run.updated_at,
        htmlUrl: run.html_url
      };
    });

    // 4. Calculate Aggregate Metrics
    const completedRuns = formattedRuns.filter((r) => r.status === "completed");
    const successfulRuns = completedRuns.filter((r) => r.conclusion === "success").length;
    const failedRuns = completedRuns.filter((r) => r.conclusion === "failure" || r.conclusion === "timed_out").length;
    const cancelledRuns = completedRuns.filter((r) => r.conclusion === "cancelled").length;
    const inProgressRuns = formattedRuns.filter((r) => r.status === "in_progress" || r.status === "queued").length;

    const successRate =
      completedRuns.length > 0
        ? parseFloat(((successfulRuns / completedRuns.length) * 100).toFixed(1))
        : 0;

    const failureRate =
      completedRuns.length > 0
        ? parseFloat(((failedRuns / completedRuns.length) * 100).toFixed(1))
        : 0;

    // Average duration across completed runs
    const runsWithDuration = completedRuns.filter((r) => r.durationSeconds > 0);
    const avgDurationSeconds =
      runsWithDuration.length > 0
        ? Math.round(runsWithDuration.reduce((sum, r) => sum + r.durationSeconds, 0) / runsWithDuration.length)
        : 0;
    const avgDurationFormatted = formatDuration(avgDurationSeconds);

    const health = getHealthGrade(successRate, completedRuns.length);

    // 5. Workflows Breakdown
    const rawWorkflows = Array.isArray(workflowsRes?.workflows) ? workflowsRes.workflows : [];
    
    // Group runs by workflow ID or workflow name
    const workflowSummaries = rawWorkflows.map((wf) => {
      const matchingRuns = formattedRuns.filter(
        (r) => r.workflowId === wf.id || r.name.toLowerCase() === wf.name.toLowerCase()
      );
      const wfCompleted = matchingRuns.filter((r) => r.status === "completed");
      const wfSuccess = wfCompleted.filter((r) => r.conclusion === "success").length;
      const wfFail = wfCompleted.filter((r) => r.conclusion === "failure" || r.conclusion === "timed_out").length;

      const wfPassRate =
        wfCompleted.length > 0
          ? parseFloat(((wfSuccess / wfCompleted.length) * 100).toFixed(1))
          : 0;

      const wfDurations = wfCompleted.filter((r) => r.durationSeconds > 0);
      const wfAvgDuration =
        wfDurations.length > 0
          ? Math.round(wfDurations.reduce((sum, r) => sum + r.durationSeconds, 0) / wfDurations.length)
          : 0;

      // Last 10 run conclusions for sparkline / dot matrix
      const recentStatuses = matchingRuns.slice(0, 10).map((r) => ({
        id: r.id,
        conclusion: r.conclusion,
        durationFormatted: r.durationFormatted,
        createdAt: r.createdAt
      }));

      const lastRun = matchingRuns[0] || null;

      return {
        id: wf.id,
        name: wf.name,
        path: wf.path,
        state: wf.state, // "active", "disabled_manually", etc.
        badgeUrl: wf.badge_url,
        htmlUrl: wf.html_url,
        totalRuns: matchingRuns.length,
        successfulRuns: wfSuccess,
        failedRuns: wfFail,
        passRate: wfPassRate,
        avgDurationSeconds: wfAvgDuration,
        avgDurationFormatted: formatDuration(wfAvgDuration),
        recentStatuses,
        lastRun
      };
    });

    // 6. Flakiness indicator
    // Flakiness: Count status alternations (success -> failure or failure -> success on consecutive runs of the same workflow)
    let flipCount = 0;
    let transitionCount = 0;
    for (let i = 0; i < completedRuns.length - 1; i++) {
      if (completedRuns[i].workflowId === completedRuns[i + 1].workflowId) {
        transitionCount++;
        const curr = completedRuns[i].conclusion === "success";
        const next = completedRuns[i + 1].conclusion === "success";
        if (curr !== next) flipCount++;
      }
    }
    const flakinessRate = transitionCount > 0 ? parseFloat(((flipCount / transitionCount) * 100).toFixed(1)) : 0;
    let flakinessLevel = "Low";
    if (flakinessRate >= 25) flakinessLevel = "High";
    else if (flakinessRate >= 12) flakinessLevel = "Moderate";

    return {
      ciDetected: detectedProviders.length > 0,
      providers: detectedProviders,
      summary: {
        totalWorkflows: rawWorkflows.length,
        totalRunsAnalyzed,
        completedRuns: completedRuns.length,
        successfulRuns,
        failedRuns,
        cancelledRuns,
        inProgressRuns,
        successRate,
        failureRate,
        avgDurationSeconds,
        avgDurationFormatted,
        flakinessRate,
        flakinessLevel,
        healthGrade: health.grade,
        healthLabel: health.label,
        healthColor: health.color
      },
      workflows: workflowSummaries,
      recentRuns: formattedRuns.slice(0, 30),
      dataAvailable: detectedProviders.length > 0 || formattedRuns.length > 0
    };
  } catch (error) {
    console.error("CI service error:", error.message);
    return {
      ciDetected: false,
      providers: [],
      summary: {
        totalWorkflows: 0,
        totalRunsAnalyzed: 0,
        completedRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        cancelledRuns: 0,
        inProgressRuns: 0,
        successRate: 0,
        failureRate: 0,
        avgDurationSeconds: 0,
        avgDurationFormatted: "0s",
        flakinessRate: 0,
        flakinessLevel: "Unknown",
        healthGrade: "N/A",
        healthLabel: "Analysis Failed",
        healthColor: "#6b7280"
      },
      workflows: [],
      recentRuns: [],
      dataAvailable: false,
      error: error.message
    };
  }
};
