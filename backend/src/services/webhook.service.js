const axios = require("axios");

// In-memory store for alert subscriptions and delivery logs
const subscriptions = new Map();
const deliveryHistory = [];

const EVENT_CONFIG = {
  release: {
    label: "New Release Published",
    color: 0x2eb886, // Green
    icon: "🏷️",
    severity: "Info"
  },
  vulnerability: {
    label: "Security CVE Detected",
    color: 0xe01e5a, // Red
    icon: "🚨",
    severity: "Critical"
  },
  quality_alert: {
    label: "Quality Score Alert",
    color: 0xecb22e, // Yellow/Amber
    icon: "⚠️",
    severity: "Warning"
  },
  bus_factor: {
    label: "Bus Factor Risk Alert",
    color: 0xe01e5a, // Red
    icon: "👥",
    severity: "High"
  },
  star_milestone: {
    label: "Star Milestone Reached",
    color: 0x36a64f, // Green
    icon: "⭐",
    severity: "Info"
  },
  ci_failure: {
    label: "CI/CD Build Failure",
    color: 0xdc2626, // Red
    icon: "❌",
    severity: "High"
  }
};

const formatSlackPayload = (eventKey, repo, details = {}) => {
  const cfg = EVENT_CONFIG[eventKey] || { label: "Repository Alert", icon: "🔔", severity: "Info" };
  const title = `${cfg.icon} [${repo}] ${cfg.label}`;
  const message = details.message || `An automated alert was triggered for repository ${repo}.`;

  return {
    text: title,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: title.substring(0, 150),
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Repository:* <https://github.com/${repo}|${repo}>\n*Event:* ${cfg.label}\n*Details:* ${message}`
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Severity:*\n${cfg.severity}`
          },
          {
            type: "mrkdwn",
            text: `*Timestamp:*\n${new Date().toISOString()}`
          }
        ]
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Sent by *GitHub Repo Analyzer Alert Center*"
          }
        ]
      }
    ]
  };
};

const formatDiscordPayload = (eventKey, repo, details = {}) => {
  const cfg = EVENT_CONFIG[eventKey] || { label: "Repository Alert", color: 0x5865f2, icon: "🔔", severity: "Info" };
  const message = details.message || `An automated alert was triggered for repository ${repo}.`;

  return {
    username: "GitHub Repo Analyzer",
    avatar_url: "https://github.githubassets.com/favicons/favicon.png",
    embeds: [
      {
        title: `${cfg.icon} [${repo}] ${cfg.label}`,
        description: message,
        color: cfg.color,
        fields: [
          { name: "Repository", value: `[${repo}](https://github.com/${repo})`, inline: true },
          { name: "Event", value: cfg.label, inline: true },
          { name: "Severity", value: cfg.severity, inline: true }
        ],
        footer: {
          text: "GitHub Repo Analyzer — Notification Center"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };
};

const formatCustomPayload = (eventKey, repo, details = {}) => {
  return {
    source: "GitHub-Repo-Analyzer",
    event: eventKey,
    repository: repo,
    timestamp: new Date().toISOString(),
    details
  };
};

// Mask webhook URL for safe UI display
const maskUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (url.length <= 25) return url;
  const start = url.substring(0, 20);
  const end = url.substring(url.length - 6);
  return `${start}...${end}`;
};

exports.getAllSubscriptions = async () => {
  return Array.from(subscriptions.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
};

exports.createSubscription = async ({ repo, channel, destinationUrl, events = [] }) => {
  if (!destinationUrl || !channel) {
    throw new Error("Channel and destinationUrl are required");
  }

  const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const validEvents = events.length > 0 ? events : Object.keys(EVENT_CONFIG);

  const sub = {
    id,
    repo: repo || "*",
    channel, // "slack", "discord", "custom"
    destinationUrl,
    displayUrl: maskUrl(destinationUrl),
    events: validEvents,
    enabled: true,
    deliveryCount: 0,
    createdAt: new Date().toISOString(),
    lastDeliveredAt: null
  };

  subscriptions.set(id, sub);
  return sub;
};

exports.updateSubscription = async (id, updateData) => {
  const sub = subscriptions.get(id);
  if (!sub) {
    throw new Error("Subscription not found");
  }

  const updated = {
    ...sub,
    ...updateData,
    id: sub.id, // Immutable
    createdAt: sub.createdAt, // Immutable
    displayUrl: updateData.destinationUrl ? maskUrl(updateData.destinationUrl) : sub.displayUrl
  };

  subscriptions.set(id, updated);
  return updated;
};

exports.deleteSubscription = async (id) => {
  const existed = subscriptions.delete(id);
  return { deleted: existed, id };
};

exports.testWebhook = async ({ channel, destinationUrl, eventType = "release", repo = "facebook/react" }) => {
  if (!destinationUrl) {
    throw new Error("Destination webhook URL is required");
  }

  const startTime = Date.now();
  let payload;
  const headers = { "Content-Type": "application/json" };

  const sampleDetails = {
    release: { message: "Production release v19.0.0 shipped with React Compiler and Asset Loading" },
    vulnerability: { message: "Critical advisory CVE-2026-4821 found in nested dependencies" },
    quality_alert: { message: "Overall repo quality grade slipped to C+ due to missing issue templates" },
    bus_factor: { message: "Bus Factor risk elevated: 1 maintainer owns 78% of all code contributions" },
    star_milestone: { message: "Milestone crossed! Repository just reached 225,000 GitHub stars 🌟" },
    ci_failure: { message: "CI workflow 'Lint & Tests' failed on branch main (commit 4b8d2a1)" }
  }[eventType] || { message: "Simulated test notification from GitHub Repo Analyzer" };

  if (channel === "slack") {
    payload = formatSlackPayload(eventType, repo, sampleDetails);
  } else if (channel === "discord") {
    payload = formatDiscordPayload(eventType, repo, sampleDetails);
  } else {
    payload = formatCustomPayload(eventType, repo, sampleDetails);
    headers["X-GRA-Event"] = eventType;
    headers["X-GRA-Delivery"] = `del_${Date.now()}`;
  }

  try {
    const res = await axios.post(destinationUrl, payload, { headers, timeout: 10000 });
    const durationMs = Date.now() - startTime;

    const logEntry = {
      id: `del_${Date.now()}`,
      channel,
      destinationUrl: maskUrl(destinationUrl),
      eventType,
      repo,
      statusCode: res.status,
      status: "Delivered",
      durationMs,
      timestamp: new Date().toISOString()
    };
    deliveryHistory.unshift(logEntry);
    if (deliveryHistory.length > 50) deliveryHistory.pop();

    return {
      success: true,
      statusCode: res.status,
      durationMs,
      message: `Test alert delivered successfully to ${channel}!`
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const statusCode = error.response?.status || 500;

    const logEntry = {
      id: `del_${Date.now()}`,
      channel,
      destinationUrl: maskUrl(destinationUrl),
      eventType,
      repo,
      statusCode,
      status: "Failed",
      error: error.message,
      durationMs,
      timestamp: new Date().toISOString()
    };
    deliveryHistory.unshift(logEntry);
    if (deliveryHistory.length > 50) deliveryHistory.pop();

    throw new Error(`Webhook dispatch failed (${statusCode}): ${error.message}`);
  }
};

exports.getDeliveryHistory = async () => {
  return deliveryHistory.slice(0, 50);
};

exports.getEventCatalog = () => {
  return Object.entries(EVENT_CONFIG).map(([key, cfg]) => ({
    key,
    label: cfg.label,
    icon: cfg.icon,
    severity: cfg.severity
  }));
};
