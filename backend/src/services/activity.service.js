const { githubRequest, githubRequestSafe } = require("../utils/githubApi");

// Map GitHub event types to human-readable labels + icons
const EVENT_MAP = {
  PushEvent: { icon: "📝", label: "pushed commits", color: "#0366d6" },
  PullRequestEvent: { icon: "🔀", label: "pull request", color: "#6f42c1" },
  IssuesEvent: { icon: "🐛", label: "issue", color: "#dc3545" },
  IssueCommentEvent: { icon: "💬", label: "commented on issue", color: "#586069" },
  WatchEvent: { icon: "⭐", label: "starred repo", color: "#f4a900" },
  ForkEvent: { icon: "🍴", label: "forked repo", color: "#28a745" },
  CreateEvent: { icon: "✨", label: "created", color: "#28a745" },
  DeleteEvent: { icon: "🗑️", label: "deleted", color: "#dc3545" },
  ReleaseEvent: { icon: "🚀", label: "published release", color: "#0366d6" },
  PullRequestReviewEvent: { icon: "👀", label: "reviewed PR", color: "#6f42c1" },
  PullRequestReviewCommentEvent: { icon: "💬", label: "reviewed PR code", color: "#6f42c1" },
  CommitCommentEvent: { icon: "💬", label: "commented on commit", color: "#586069" },
  MemberEvent: { icon: "👤", label: "member event", color: "#17a2b8" },
  PublicEvent: { icon: "🌐", label: "made repo public", color: "#28a745" }
};

const formatEvent = (event) => {
  const meta = EVENT_MAP[event.type] || { icon: "📌", label: event.type, color: "#586069" };
  const actor = event.actor?.login || "Unknown";
  const payload = event.payload || {};

  let detail = "";
  let ref = "";

  switch (event.type) {
    case "PushEvent":
      detail = `${payload.commits?.length || 0} commit(s) to ${payload.ref?.replace("refs/heads/", "") || "main"}`;
      ref = payload.commits?.[0]?.message?.split("\n")[0]?.slice(0, 72) || "";
      break;
    case "PullRequestEvent":
      detail = `${payload.action} "${payload.pull_request?.title?.slice(0, 60) || "PR"}"`;
      ref = `#${payload.pull_request?.number || ""}`;
      break;
    case "IssuesEvent":
      detail = `${payload.action} "${payload.issue?.title?.slice(0, 60) || "issue"}"`;
      ref = `#${payload.issue?.number || ""}`;
      break;
    case "IssueCommentEvent":
      detail = `on issue #${payload.issue?.number || "?"}`;
      ref = payload.comment?.body?.slice(0, 60) || "";
      break;
    case "WatchEvent":
      detail = "starred this repository";
      break;
    case "ForkEvent":
      detail = `forked to ${payload.forkee?.full_name || "unknown"}`;
      break;
    case "CreateEvent":
      detail = `${payload.ref_type} "${payload.ref || payload.description || ""}"`;
      break;
    case "DeleteEvent":
      detail = `${payload.ref_type} "${payload.ref || ""}"`;
      break;
    case "ReleaseEvent":
      detail = `${payload.action} ${payload.release?.tag_name || ""}`;
      ref = payload.release?.name || "";
      break;
    case "PullRequestReviewEvent":
      detail = `${payload.review?.state || "reviewed"} PR #${payload.pull_request?.number || ""}`;
      break;
    default:
      detail = event.type.replace("Event", "");
  }

  return {
    id: event.id,
    type: event.type,
    icon: meta.icon,
    label: meta.label,
    color: meta.color,
    actor,
    actorAvatar: event.actor?.avatar_url || null,
    actorUrl: `https://github.com/${actor}`,
    detail,
    ref,
    createdAt: event.created_at,
    repoName: event.repo?.name || ""
  };
};

// Fetch recent public events for a repo (up to 100, GitHub API limit per page)
const getRepoEvents = async (owner, repo, perPage = 30) => {
  try {
    const events = await githubRequest(
      `/repos/${owner}/${repo}/events?per_page=${perPage}`
    );
    return Array.isArray(events) ? events.map(formatEvent) : [];
  } catch (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }
};

// Aggregate stats from events
const getActivityStats = async (owner, repo) => {
  try {
    const events = await githubRequest(
      `/repos/${owner}/${repo}/events?per_page=100`
    );

    if (!Array.isArray(events)) return { total: 0, byType: {}, activeContributors: [] };

    const byType = {};
    const contributorSet = new Map();

    for (const ev of events) {
      byType[ev.type] = (byType[ev.type] || 0) + 1;
      if (ev.actor?.login) {
        const count = contributorSet.get(ev.actor.login) || 0;
        contributorSet.set(ev.actor.login, count + 1);
      }
    }

    const activeContributors = [...contributorSet.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([login, count]) => ({ login, count }));

    return {
      total: events.length,
      byType,
      activeContributors,
      periodNote: "Last 100 events (GitHub API limit)"
    };
  } catch (error) {
    return { total: 0, byType: {}, activeContributors: [], error: error.message };
  }
};

module.exports = { getRepoEvents, getActivityStats, formatEvent };
