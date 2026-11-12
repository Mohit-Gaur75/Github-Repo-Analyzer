import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getActivity, getActivityStreamUrl } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import { timeAgo } from "../utils/helpers";

// ─── Event type color dot ─────────────────────────────────────────────────────
function EventDot({ color }) {
  return (
    <span style={{
      display: "inline-block",
      width: 10, height: 10,
      borderRadius: "50%",
      backgroundColor: color,
      flexShrink: 0,
      marginTop: 4
    }} />
  );
}

// ─── Single event row ─────────────────────────────────────────────────────────
function EventRow({ ev, isNew }) {
  return (
    <div style={{
      display: "flex", gap: 12, padding: "12px 16px",
      borderBottom: "1px solid #f0f0f0",
      background: isNew ? "#f0fff4" : "transparent",
      transition: "background 2s ease",
      alignItems: "flex-start",
      animation: isNew ? "slideIn 0.3s ease" : "none"
    }}>
      {/* Avatar */}
      {ev.actorAvatar ? (
        <img src={ev.actorAvatar} alt={ev.actor}
          style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 32, height: 32, borderRadius: "50%",
          background: "#e1e4e8", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
          {ev.actor?.[0]?.toUpperCase() || "?"}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <EventDot color={ev.color} />
          <span style={{ fontSize: 14 }}>
            <a href={ev.actorUrl} target="_blank" rel="noreferrer"
              style={{ fontWeight: 700, color: "#0366d6", textDecoration: "none" }}>
              {ev.actor}
            </a>
            {" "}
            <span style={{ color: "#586069" }}>{ev.label}</span>
          </span>
          <span style={{ fontSize: 11, color: "#959da5", marginLeft: "auto" }}>
            {timeAgo(ev.createdAt)}
          </span>
        </div>
        {ev.detail && (
          <p style={{ margin: "4px 0 0 16px", fontSize: 13, color: "#444",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {ev.icon} {ev.detail}
          </p>
        )}
        {ev.ref && (
          <p style={{ margin: "2px 0 0 16px", fontSize: 12, color: "#959da5",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            fontStyle: "italic" }}>
            {ev.ref}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Stats cards at top ───────────────────────────────────────────────────────
function ActivityStats({ stats }) {
  if (!stats) return null;
  const topTypes = Object.entries(stats.byType || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
      <div className="card" style={{ padding: "14px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#0366d6" }}>{stats.total}</div>
        <div style={{ fontSize: 12, color: "#586069" }}>Total Events</div>
      </div>
      {topTypes.map(([type, count]) => {
        const label = type.replace("Event", "").replace(/([A-Z])/g, " $1").trim();
        return (
          <div key={type} className="card" style={{ padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#28a745" }}>{count}</div>
            <div style={{ fontSize: 12, color: "#586069" }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function Activity() {
  const { owner, repo } = useParams();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveStatus, setLiveStatus] = useState("connecting"); // connecting | live | error | off
  const [newEventIds, setNewEventIds] = useState(new Set());
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [fetchedAt, setFetchedAt] = useState(null);
  const eventSourceRef = useRef(null);
  const listRef = useRef(null);

  // Load initial data via REST
  useEffect(() => {
    setLoading(true);
    getActivity(owner, repo, 30)
      .then((res) => {
        setEvents(res.data.events || []);
        setStats(res.data.stats || null);
        setFetchedAt(res.data.fetchedAt);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  // SSE live stream
  const startStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = getActivityStreamUrl(owner, repo);
    const es = new EventSource(url);
    eventSourceRef.current = es;
    setLiveStatus("connecting");

    es.addEventListener("history", (e) => {
      const { events: hist } = JSON.parse(e.data);
      setEvents((prev) => {
        const existingIds = new Set(prev.map((ev) => ev.id));
        const fresh = hist.filter((ev) => !existingIds.has(ev.id));
        return [...fresh, ...prev].slice(0, 100);
      });
      setLiveStatus("live");
    });

    es.addEventListener("event", (e) => {
      const ev = JSON.parse(e.data);
      setEvents((prev) => {
        const existingIds = new Set(prev.map((x) => x.id));
        if (existingIds.has(ev.id)) return prev;
        return [ev, ...prev].slice(0, 100);
      });
      setNewEventIds((prev) => {
        const next = new Set([...prev, ev.id]);
        // Auto-remove green flash after 3s
        setTimeout(() => setNewEventIds((s) => { const c = new Set(s); c.delete(ev.id); return c; }), 3000);
        return next;
      });
      // Scroll to top to show new event
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });

    es.addEventListener("error", (e) => {
      const data = e.data ? JSON.parse(e.data) : {};
      setLiveStatus("error");
      console.warn("SSE error event:", data.message);
    });

    es.onerror = () => {
      setLiveStatus("error");
    };

    es.onopen = () => setLiveStatus("live");
  }, [owner, repo]);

  useEffect(() => {
    if (!loading && liveEnabled) startStream();
    return () => eventSourceRef.current?.close();
  }, [loading, liveEnabled, startStream]);

  const toggleLive = () => {
    if (liveEnabled) {
      eventSourceRef.current?.close();
      setLiveStatus("off");
    } else {
      startStream();
    }
    setLiveEnabled((v) => !v);
  };

  if (loading) return <LoadingSpinner message="Fetching activity feed…" />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  const statusColor = { live: "#28a745", connecting: "#f4a900", error: "#dc3545", off: "#959da5" };
  const statusLabel = { live: "● Live", connecting: "◌ Connecting…", error: "✕ Reconnecting", off: "○ Paused" };

  return (
    <div>
      <RepoNav />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            📊 Activity Feed
          </h2>
          <span style={{ fontSize: 13, color: "#586069" }}>
            {owner}/{repo} · {events.length} events
            {fetchedAt && ` · loaded ${new Date(fetchedAt).toLocaleTimeString()}`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: statusColor[liveStatus] }}>
            {statusLabel[liveStatus]}
          </span>
          <button
            onClick={toggleLive}
            className={`btn btn-sm ${liveEnabled ? "btn-secondary" : "btn-primary"}`}
          >
            {liveEnabled ? "⏸ Pause Live" : "▶ Resume Live"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <ActivityStats stats={stats} />

      {/* Active contributors */}
      {stats?.activeContributors?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title" style={{ marginBottom: 14 }}>🔥 Most Active (Recent)</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {stats.activeContributors.map((c) => (
              <a key={c.login} href={`https://github.com/${c.login}`}
                target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 12px", borderRadius: 20,
                  background: "#f6f8fa", border: "1px solid #e1e4e8",
                  textDecoration: "none", color: "#24292e", fontSize: 13 }}>
                <img src={`https://github.com/${c.login}.png?size=24`}
                  alt={c.login} style={{ width: 20, height: 20, borderRadius: "50%" }} />
                <strong>{c.login}</strong>
                <span style={{ background: "#0366d6", color: "#fff",
                  borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>
                  {c.count}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Event list */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e1e4e8",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            📋 Event Timeline
          </span>
          <span style={{ fontSize: 12, color: "#959da5" }}>
            Polls every 30s when live
          </span>
        </div>
        <div ref={listRef} style={{ maxHeight: 600, overflowY: "auto" }}>
          {events.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#959da5" }}>
              No recent public events found for this repository.
            </div>
          ) : (
            events.map((ev) => (
              <EventRow key={ev.id} ev={ev} isNew={newEventIds.has(ev.id)} />
            ))
          )}
        </div>
      </div>

      {/* CSS animation for new events */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Activity;
