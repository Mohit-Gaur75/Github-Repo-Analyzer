const { getRepoEvents, getActivityStats } = require("../services/activity.service");
const { githubRequest } = require("../utils/githubApi");
const { formatEvent } = require("../services/activity.service");

// GET /api/activity/:owner/:repo — recent events (REST, cached)
exports.getActivity = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const perPage = Math.min(parseInt(req.query.per_page) || 30, 100);

    const [events, stats] = await Promise.all([
      getRepoEvents(owner, repo, perPage),
      getActivityStats(owner, repo)
    ]);

    res.json({
      success: true,
      data: { events, stats, fetchedAt: new Date().toISOString() }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch activity",
      message: error.message
    });
  }
};

// GET /api/activity/:owner/:repo/stream — SSE live feed
// Polls GitHub every 30s and streams new events to the client
exports.streamActivity = (req, res) => {
  const { owner, repo } = req.params;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering
  res.flushHeaders();

  // Track the latest event ID to avoid duplicates
  let latestEventId = null;
  let isFirstPoll = true;

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (res.flush) res.flush(); // Some environments need explicit flush
  };

  // Send a heartbeat comment every 20s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
    if (res.flush) res.flush();
  }, 20000);

  const poll = async () => {
    try {
      const events = await githubRequest(
        `/repos/${owner}/${repo}/events?per_page=20`
      );

      if (!Array.isArray(events) || events.length === 0) return;

      if (isFirstPoll) {
        // On first poll: send last 10 events as "history"
        const history = events.slice(0, 10).map(formatEvent);
        send("history", { events: history });
        latestEventId = events[0]?.id || null;
        isFirstPoll = false;
        return;
      }

      // On subsequent polls: only send NEW events (newer than latestEventId)
      const newEvents = [];
      for (const ev of events) {
        if (ev.id === latestEventId) break;
        newEvents.push(formatEvent(ev));
      }

      if (newEvents.length > 0) {
        latestEventId = events[0].id;
        // Send newest first
        for (const ev of newEvents.reverse()) {
          send("event", ev);
        }
      }
    } catch (err) {
      send("error", { message: err.message });
    }
  };

  // Poll immediately, then every 30 seconds
  poll();
  const poller = setInterval(poll, 30000);

  // Clean up when client disconnects
  req.on("close", () => {
    clearInterval(heartbeat);
    clearInterval(poller);
  });
};
