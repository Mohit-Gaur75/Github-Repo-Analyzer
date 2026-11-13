import { useState, useEffect, useCallback } from "react";
import {
  getAlertSubscriptions,
  createAlertSubscription,
  updateAlertSubscription,
  deleteAlertSubscription,
  testWebhookAlert,
  getAlertHistory
} from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { timeAgo } from "../utils/helpers";

const DEFAULT_EVENTS = [
  { key: "release", label: "New Release Published", icon: "🏷️", desc: "Triggers on SemVer version releases & tag updates" },
  { key: "vulnerability", label: "Security CVE Detected", icon: "🚨", desc: "High or critical advisory flagged by OSV.dev" },
  { key: "ci_failure", label: "CI/CD Build Failure", icon: "❌", desc: "GitHub Actions workflow run failed on default branch" },
  { key: "quality_alert", label: "Quality Score Alert", icon: "⚠️", desc: "Repository quality grade slips below threshold" },
  { key: "bus_factor", label: "Bus Factor Risk Alert", icon: "👥", desc: "High contributor concentration risk (Bus Factor ≤ 2)" },
  { key: "star_milestone", label: "Star Milestone Reached", icon: "⭐", desc: "Major star achievements (1k, 10k, 50k, 100k)" }
];

export default function Alerts() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formRepo, setFormRepo] = useState("");
  const [formChannel, setFormChannel] = useState("slack");
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState(["release", "vulnerability", "ci_failure"]);
  const [creating, setCreating] = useState(false);

  // Quick test state
  const [testChannel, setTestChannel] = useState("slack");
  const [testUrl, setTestUrl] = useState("");
  const [testEvent, setTestEvent] = useState("release");
  const [testRepo, setTestRepo] = useState("facebook/react");
  const [testing, setTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError("");

    Promise.all([
      getAlertSubscriptions().catch(() => ({ data: [] })),
      getAlertHistory().catch(() => ({ data: [] }))
    ])
      .then(([subRes, histRes]) => {
        setSubscriptions(subRes.data || []);
        setHistory(histRes.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle create subscription
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formUrl.trim()) {
      alert("Please enter a valid webhook URL");
      return;
    }
    setCreating(true);

    try {
      const res = await createAlertSubscription({
        repo: formRepo.trim() || "*",
        channel: formChannel,
        destinationUrl: formUrl.trim(),
        events: formEvents
      });

      if (res.success && res.data) {
        setSubscriptions((prev) => [res.data, ...prev]);
        setShowCreateForm(false);
        setFormUrl("");
        setFormRepo("");
      }
    } catch (err) {
      alert("Failed to create subscription: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  // Toggle active state
  const handleToggleActive = async (sub) => {
    try {
      const res = await updateAlertSubscription(sub.id, { enabled: !sub.enabled });
      if (res.success && res.data) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === sub.id ? { ...s, enabled: res.data.enabled } : s))
        );
      }
    } catch (err) {
      alert("Failed to update subscription: " + err.message);
    }
  };

  // Delete subscription
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this alert subscription?")) return;
    try {
      await deleteAlertSubscription(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert("Failed to delete subscription: " + err.message);
    }
  };

  // Send live test webhook
  const handleSendTest = async (overrideUrl = null, overrideChannel = null) => {
    const url = overrideUrl || testUrl;
    const channel = overrideChannel || testChannel;

    if (!url.trim()) {
      alert("Please enter a destination webhook URL to test");
      return;
    }

    setTesting(true);
    setTestFeedback(null);

    try {
      const res = await testWebhookAlert({
        channel,
        destinationUrl: url.trim(),
        eventType: testEvent,
        repo: testRepo.trim() || "facebook/react"
      });

      setTestFeedback({
        success: true,
        message: res.data?.message || "Test alert delivered successfully!",
        durationMs: res.data?.durationMs || 120
      });

      // Refresh delivery history
      getAlertHistory().then((h) => setHistory(h.data || []));
    } catch (err) {
      setTestFeedback({
        success: false,
        message: err.message
      });
      // Refresh delivery history
      getAlertHistory().then((h) => setHistory(h.data || []));
    } finally {
      setTesting(false);
    }
  };

  const toggleEventSelect = (key) => {
    setFormEvents((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  if (loading) return <LoadingSpinner message="Loading webhook subscriptions & alert history..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      {/* Header Banner */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title">🔔 Webhook &amp; Notification Alert Center</h1>
          <p className="page-subtitle">
            Automated Slack, Discord, and HTTP Webhook alerts for releases, CVEs, CI failures, and quality drops
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ fontSize: "13px" }}
          >
            {showCreateForm ? "✕ Close Form" : "+ New Alert Subscription"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={loadData}
            style={{ fontSize: "13px" }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid-4" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-value">{subscriptions.length}</div>
          <div className="stat-label">Active Subscriptions</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📨</div>
          <div className="stat-value" style={{ color: "#059669" }}>
            {history.filter((h) => h.status === "Delivered").length}
          </div>
          <div className="stat-label">Alerts Delivered</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">6</div>
          <div className="stat-label">Monitored Event Triggers</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-value">3</div>
          <div className="stat-label">Channels (Slack/Discord/JSON)</div>
        </div>
      </div>

      {/* Collapsible Create Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: "24px", border: "1px solid var(--primary-color, #0969da)" }}>
          <h3 className="card-title" style={{ marginBottom: "16px" }}>
            ✨ Create Alert Subscription
          </h3>

          <form onSubmit={handleCreate}>
            <div className="grid-3" style={{ marginBottom: "16px" }}>
              {/* Target Repo */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                  Target Repository
                </label>
                <input
                  type="text"
                  placeholder="e.g. facebook/react (or * for all)"
                  value={formRepo}
                  onChange={(e) => setFormRepo(e.target.value)}
                  className="input"
                  style={{ width: "100%", fontSize: "13px" }}
                />
                <span style={{ fontSize: "11px", color: "var(--text-secondary, #586069)" }}>
                  Leave blank or use * for all watchlisted repos
                </span>
              </div>

              {/* Destination Channel */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                  Channel Integration
                </label>
                <select
                  value={formChannel}
                  onChange={(e) => setFormChannel(e.target.value)}
                  className="input"
                  style={{ width: "100%", fontSize: "13px" }}
                >
                  <option value="slack">💬 Slack Incoming Webhook</option>
                  <option value="discord">🎮 Discord Channel Webhook</option>
                  <option value="custom">🌐 Generic JSON HTTP Webhook</option>
                </select>
                <span style={{ fontSize: "11px", color: "var(--text-secondary, #586069)" }}>
                  Payload will be tailored to the channel
                </span>
              </div>

              {/* Webhook URL */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                  Destination Webhook URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://hooks.slack.com/... or https://discord.com/api/webhooks/..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="input"
                  style={{ width: "100%", fontSize: "13px" }}
                />
                <span style={{ fontSize: "11px", color: "var(--text-secondary, #586069)" }}>
                  Paste your channel webhook URL
                </span>
              </div>
            </div>

            {/* Event Trigger Selection */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "8px" }}>
                Select Event Triggers:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                {DEFAULT_EVENTS.map((ev) => {
                  const isChecked = formEvents.includes(ev.key);
                  return (
                    <div
                      key={ev.key}
                      onClick={() => toggleEventSelect(ev.key)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        border: `1px solid ${isChecked ? "var(--primary-color, #0969da)" : "var(--border-color, #e1e4e8)"}`,
                        backgroundColor: isChecked ? (document.body.classList.contains("dark") ? "rgba(56, 139, 253, 0.1)" : "rgba(9, 105, 218, 0.05)") : "var(--bg-secondary, #f6f8fa)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ marginTop: "3px" }}
                      />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600" }}>
                          {ev.icon} {ev.label}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary, #586069)", marginTop: "2px" }}>
                          {ev.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? "Saving..." : "Save Subscription"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Live Webhook Test Simulator */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 className="card-title" style={{ marginBottom: "8px" }}>
          ⚡ Live Webhook Simulator &amp; Tester
        </h3>
        <p style={{ fontSize: "13px", color: "var(--text-secondary, #586069)", marginBottom: "16px" }}>
          Test your Slack or Discord webhook in real-time with sample event payloads.
        </p>

        <div className="grid-4" style={{ marginBottom: "12px", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>
              Channel
            </label>
            <select
              value={testChannel}
              onChange={(e) => setTestChannel(e.target.value)}
              className="input"
              style={{ width: "100%", fontSize: "13px" }}
            >
              <option value="slack">💬 Slack</option>
              <option value="discord">🎮 Discord</option>
              <option value="custom">🌐 Generic JSON</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>
              Sample Event
            </label>
            <select
              value={testEvent}
              onChange={(e) => setTestEvent(e.target.value)}
              className="input"
              style={{ width: "100%", fontSize: "13px" }}
            >
              {DEFAULT_EVENTS.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.icon} {e.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>
              Sample Repo
            </label>
            <input
              type="text"
              value={testRepo}
              onChange={(e) => setTestRepo(e.target.value)}
              className="input"
              style={{ width: "100%", fontSize: "13px" }}
            />
          </div>

          <div>
            <button
              className="btn btn-primary"
              onClick={() => handleSendTest()}
              disabled={testing || !testUrl}
              style={{ width: "100%", fontSize: "13px", padding: "8px" }}
            >
              {testing ? "🚀 Sending..." : "🚀 Send Test Ping"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <input
            type="url"
            placeholder="Enter destination webhook URL to test..."
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="input"
            style={{ width: "100%", fontSize: "13px", fontFamily: "monospace" }}
          />
        </div>

        {testFeedback && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              fontSize: "13px",
              backgroundColor: testFeedback.success ? "rgba(5, 150, 105, 0.1)" : "rgba(220, 38, 38, 0.1)",
              color: testFeedback.success ? "#059669" : "#dc2626",
              border: `1px solid ${testFeedback.success ? "#059669" : "#dc2626"}40`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>{testFeedback.message}</span>
            {testFeedback.durationMs && <span>⏱️ {testFeedback.durationMs} ms</span>}
          </div>
        )}
      </div>

      {/* Active Subscriptions List */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 className="card-title" style={{ marginBottom: "16px" }}>
          📋 Configured Alert Subscriptions ({subscriptions.length})
        </h3>

        {subscriptions.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Channel</th>
                  <th>Target Repo</th>
                  <th>Destination URL</th>
                  <th>Active Events</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <span
                        className={`badge ${sub.enabled ? "badge-success" : "badge-secondary"}`}
                        style={{ cursor: "pointer", fontSize: "11px" }}
                        onClick={() => handleToggleActive(sub)}
                        title="Click to toggle active state"
                      >
                        {sub.enabled ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", fontSize: "13px" }}>
                        {sub.channel === "slack" && "💬 Slack"}
                        {sub.channel === "discord" && "🎮 Discord"}
                        {sub.channel === "custom" && "🌐 Webhook"}
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "600" }}>
                      {sub.repo === "*" ? "🌐 All Repos" : sub.repo}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--text-secondary, #586069)" }}>
                      {sub.displayUrl}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {(sub.events || []).map((e) => (
                          <span
                            key={e}
                            className="badge"
                            style={{ fontSize: "10px", backgroundColor: "var(--bg-secondary, #f6f8fa)" }}
                          >
                            {DEFAULT_EVENTS.find((d) => d.key === e)?.icon || "🔔"} {e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "3px 8px", fontSize: "11px", marginRight: "6px" }}
                        onClick={() => handleSendTest(sub.destinationUrl, sub.channel)}
                      >
                        ⚡ Test
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: "3px 8px", fontSize: "11px", color: "#dc2626" }}
                        onClick={() => handleDelete(sub.id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "36px 16px", color: "var(--text-secondary, #586069)" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔔</div>
            <h4>No webhook subscriptions configured yet</h4>
            <p style={{ fontSize: "13px", maxWidth: "450px", margin: "4px auto 16px" }}>
              Add a Slack or Discord webhook to receive instant notifications when releases drop, CVEs are detected, or CI builds fail.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
              style={{ fontSize: "13px" }}
            >
              + Create First Subscription
            </button>
          </div>
        )}
      </div>

      {/* Recent Deliveries Log */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: "16px" }}>
          📜 Recent Alert Delivery History ({history.length})
        </h3>

        {history.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "100px" }}>Status</th>
                  <th>Event</th>
                  <th>Repository</th>
                  <th>Channel &amp; Target</th>
                  <th style={{ width: "90px" }}>Latency</th>
                  <th style={{ width: "110px", textAlign: "right" }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span
                        className={`badge ${log.status === "Delivered" ? "badge-success" : "badge-danger"}`}
                        style={{ fontSize: "11px" }}
                      >
                        {log.status === "Delivered" ? `✅ ${log.statusCode}` : `❌ ${log.statusCode}`}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px", fontWeight: "500" }}>
                      {DEFAULT_EVENTS.find((e) => e.key === log.eventType)?.icon || "🔔"}{" "}
                      {DEFAULT_EVENTS.find((e) => e.key === log.eventType)?.label || log.eventType}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{log.repo}</td>
                    <td>
                      <div style={{ fontSize: "12px" }}>
                        <span style={{ fontWeight: "600", textTransform: "capitalize", marginRight: "6px" }}>
                          {log.channel}
                        </span>
                        <span style={{ color: "var(--text-secondary, #586069)", fontFamily: "monospace" }}>
                          {log.destinationUrl}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>{log.durationMs} ms</td>
                    <td style={{ fontSize: "12px", color: "var(--text-secondary, #586069)", textAlign: "right", whiteSpace: "nowrap" }}>
                      {timeAgo(log.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary, #586069)", fontSize: "13px" }}>
            No delivery events recorded in this session yet. Use the simulator above to send a test alert!
          </div>
        )}
      </div>
    </div>
  );
}
