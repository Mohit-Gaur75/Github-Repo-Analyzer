import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getCIHealth } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import { timeAgo } from "../utils/helpers";

export default function CIHealth() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Filter state for recent runs
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "success", "failure", "in_progress"
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const fetchData = useCallback(
    (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      getCIHealth(owner, repo)
        .then((res) => setData(res.data))
        .catch((err) => setError(err.message))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [owner, repo]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = data?.summary || {};
  const workflows = data?.workflows || [];
  const providers = data?.providers || [];

  // Filtered runs
  const filteredRuns = useMemo(() => {
    const runs = data?.recentRuns || [];
    return runs.filter((run) => {
      // Status filter
      if (statusFilter === "success" && run.conclusion !== "success") return false;
      if (statusFilter === "failure" && run.conclusion !== "failure" && run.conclusion !== "timed_out") return false;
      if (statusFilter === "in_progress" && run.status !== "in_progress" && run.status !== "queued") return false;

      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = run.name?.toLowerCase().includes(q);
        const matchBranch = run.branch?.toLowerCase().includes(q);
        const matchCommit = run.commitMessage?.toLowerCase().includes(q);
        const matchActor = run.actor?.login?.toLowerCase().includes(q);
        const matchSha = run.commitSha?.toLowerCase().includes(q);
        if (!matchName && !matchBranch && !matchCommit && !matchActor && !matchSha) {
          return false;
        }
      }
      return true;
    });
  }, [data?.recentRuns, statusFilter, searchQuery]);

  const starterWorkflowYaml = `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm test --if-present
`;

  const copyStarterSnippet = () => {
    navigator.clipboard.writeText(starterWorkflowYaml);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  if (loading) return <LoadingSpinner message="Scanning CI/CD pipelines, workflows & build history..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

  const renderStatusBadge = (conclusion, status) => {
    if (status === "in_progress" || status === "queued") {
      return (
        <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          ⏳ In Progress
        </span>
      );
    }
    if (conclusion === "success") {
      return (
        <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          ✅ Passed
        </span>
      );
    }
    if (conclusion === "failure" || conclusion === "timed_out") {
      return (
        <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          ❌ Failed
        </span>
      );
    }
    if (conclusion === "cancelled") {
      return (
        <span className="badge" style={{ backgroundColor: "#e5e7eb", color: "#374151" }}>
          🚫 Cancelled
        </span>
      );
    }
    return (
      <span className="badge" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
        {conclusion || status || "Unknown"}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              🧪 CI/CD &amp; Workflow Health
            </h1>
            {summary.healthGrade && summary.healthGrade !== "N/A" && (
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  backgroundColor: `${summary.healthColor}15`,
                  color: summary.healthColor,
                  border: `1px solid ${summary.healthColor}40`
                }}
              >
                Grade: {summary.healthGrade} ({summary.healthLabel})
              </span>
            )}
          </div>
          <p className="page-subtitle" style={{ marginTop: "4px" }}>
            <Link to={`/dashboard/${owner}/${repo}`} style={{ color: "inherit", textDecoration: "underline" }}>
              {owner}/{repo}
            </Link>{" "}
            — GitHub Actions pipelines, build pass/fail rates, durations &amp; reliability
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{ fontSize: "13px" }}
          >
            {refreshing ? "🔄 Refreshing..." : "🔄 Refresh CI"}
          </button>
          <a
            href={`https://github.com/${owner}/${repo}/actions`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
            style={{ fontSize: "13px" }}
          >
            🔗 View on GitHub Actions
          </a>
        </div>
      </div>

      <RepoNav />

      {/* Detected CI Providers row */}
      {providers.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", color: "var(--text-secondary, #656d76)", fontWeight: "500" }}>
            Detected CI/CD Systems:
          </span>
          {providers.map((p, idx) => (
            <span
              key={idx}
              className="badge"
              style={{
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "var(--bg-secondary, #f6f8fa)",
                border: "1px solid var(--border-color, #e1e4e8)"
              }}
            >
              <span>{p.icon}</span>
              <strong>{p.name}</strong>
              <span style={{ color: "#059669", marginLeft: "2px" }}>({p.status})</span>
            </span>
          ))}
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid-4" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value" style={{ color: summary.healthColor || "#059669" }}>
            {summary.successRate}%
          </div>
          <div className="stat-label">Build Pass Rate ({summary.successfulRuns}/{summary.completedRuns || 1})</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{summary.avgDurationFormatted || "0s"}</div>
          <div className="stat-label">Average Run Duration</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-value">{summary.totalWorkflows || 0}</div>
          <div className="stat-label">Configured Workflows</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-value" style={{ color: summary.flakinessLevel === "High" ? "#dc2626" : summary.flakinessLevel === "Moderate" ? "#d97706" : "#059669" }}>
            {summary.flakinessLevel || "Low"}
          </div>
          <div className="stat-label">Pipeline Flakiness ({summary.flakinessRate || 0}%)</div>
        </div>
      </div>

      {/* Empty State when no CI exists */}
      {!data.ciDetected && (
        <div className="card" style={{ marginBottom: "24px", padding: "36px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "44px", marginBottom: "16px" }}>🧪</div>
          <h3 style={{ marginBottom: "8px" }}>No CI/CD Workflows Detected</h3>
          <p style={{ color: "var(--text-secondary, #586069)", maxWidth: "600px", margin: "0 auto 20px", fontSize: "14px", lineHeight: "1.5" }}>
            This repository does not currently have active GitHub Actions workflows or third-party CI configured.
            Setting up continuous integration automates linting, testing, and deployment to keep your code healthy.
          </p>
          <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-secondary, #586069)" }}>
                .github/workflows/ci.yml
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: "4px 8px", fontSize: "12px" }}
                onClick={copyStarterSnippet}
              >
                {copiedSnippet ? "✅ Copied!" : "📋 Copy YAML Template"}
              </button>
            </div>
            <pre
              style={{
                padding: "16px",
                borderRadius: "6px",
                backgroundColor: "var(--bg-secondary, #f6f8fa)",
                border: "1px solid var(--border-color, #e1e4e8)",
                fontSize: "12px",
                overflowX: "auto",
                lineHeight: "1.5"
              }}
            >
              {starterWorkflowYaml}
            </pre>
          </div>
        </div>
      )}

      {/* Configured Workflows Breakdown */}
      {workflows.length > 0 && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>
                📋 GitHub Actions Workflows ({workflows.length})
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary, #586069)" }}>
                Active automation pipelines and their historical reliability
              </p>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Workflow Name</th>
                  <th>Path &amp; State</th>
                  <th>Pass Rate</th>
                  <th>Avg Duration</th>
                  <th>Recent 10 Runs</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((wf) => {
                  const passPct = wf.passRate || 0;
                  const passColor = passPct >= 90 ? "#059669" : passPct >= 75 ? "#2563eb" : passPct >= 50 ? "#d97706" : "#dc2626";

                  return (
                    <tr key={wf.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "16px" }}>⚙️</span>
                          <div>
                            <div style={{ fontWeight: "600", fontSize: "14px" }}>{wf.name}</div>
                            {wf.lastRun && (
                              <div style={{ fontSize: "12px", color: "var(--text-secondary, #656d76)" }}>
                                Last ran on <strong>{wf.lastRun.branch}</strong> {timeAgo(wf.lastRun.createdAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-secondary, #586069)" }}>
                          {wf.path}
                        </div>
                        <span
                          className={`badge ${wf.state === "active" ? "badge-success" : "badge-secondary"}`}
                          style={{ fontSize: "11px", marginTop: "4px" }}
                        >
                          {wf.state}
                        </span>
                      </td>
                      <td style={{ minWidth: "140px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                          <strong style={{ color: passColor }}>{passPct}%</strong>
                          <span style={{ color: "var(--text-secondary, #656d76)" }}>
                            {wf.successfulRuns}/{wf.totalRuns}
                          </span>
                        </div>
                        <div style={{ height: "6px", borderRadius: "3px", backgroundColor: "var(--border-color, #e1e4e8)", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${passPct}%`,
                              height: "100%",
                              backgroundColor: passColor,
                              transition: "width 0.3s"
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                        {wf.avgDurationFormatted || "0s"}
                      </td>
                      <td>
                        {/* Sparkline status dots */}
                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                          {wf.recentStatuses && wf.recentStatuses.length > 0 ? (
                            wf.recentStatuses.map((st, i) => {
                              const isSuccess = st.conclusion === "success";
                              const isFail = st.conclusion === "failure" || st.conclusion === "timed_out";
                              const dotColor = isSuccess ? "#10b981" : isFail ? "#ef4444" : "#9ca3af";
                              return (
                                <span
                                  key={i}
                                  title={`Run #${st.id}: ${st.conclusion} (${st.durationFormatted}) - ${timeAgo(st.createdAt)}`}
                                  style={{
                                    display: "inline-block",
                                    width: "10px",
                                    height: "10px",
                                    borderRadius: "50%",
                                    backgroundColor: dotColor,
                                    cursor: "pointer"
                                  }}
                                />
                              );
                            })
                          ) : (
                            <span style={{ fontSize: "12px", color: "var(--text-secondary, #656d76)" }}>No runs recorded</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <a
                          href={wf.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          View 🔗
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Workflow Runs Stream */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              📜 Recent Workflow Runs ({filteredRuns.length})
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary, #586069)" }}>
              Detailed run logs, duration benchmarks, and trigger events
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Filter Pills */}
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                className={`btn ${statusFilter === "all" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => setStatusFilter("all")}
              >
                All ({summary.totalRunsAnalyzed || 0})
              </button>
              <button
                className={`btn ${statusFilter === "success" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => setStatusFilter("success")}
              >
                Passed ({summary.successfulRuns || 0})
              </button>
              <button
                className={`btn ${statusFilter === "failure" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => setStatusFilter("failure")}
              >
                Failed ({summary.failedRuns || 0})
              </button>
              {summary.inProgressRuns > 0 && (
                <button
                  className={`btn ${statusFilter === "in_progress" ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                  onClick={() => setStatusFilter("in_progress")}
                >
                  Running ({summary.inProgressRuns})
                </button>
              )}
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search branch, commit, workflow..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ width: "220px", padding: "5px 10px", fontSize: "12px" }}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: "110px" }}>Status</th>
                <th>Workflow &amp; Commit</th>
                <th style={{ width: "130px" }}>Branch &amp; Event</th>
                <th style={{ width: "160px" }}>Triggered By</th>
                <th style={{ width: "90px" }}>Duration</th>
                <th style={{ width: "110px", textAlign: "right" }}>Completed</th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.length > 0 ? (
                filteredRuns.map((run) => (
                  <tr key={run.id}>
                    <td>{renderStatusBadge(run.conclusion, run.status)}</td>
                    <td style={{ maxWidth: "400px" }}>
                      <div style={{ fontWeight: "600", fontSize: "13px" }}>
                        <a
                          href={run.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--primary-color, #0969da)", textDecoration: "none" }}
                        >
                          {run.name}
                        </a>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary, #656d76)", marginTop: "2px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: "600", marginRight: "6px" }}>
                          {run.commitSha}
                        </span>
                        {run.commitMessage}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: "500" }}>
                        🌿 {run.branch}
                      </div>
                      <span
                        className="badge"
                        style={{
                          fontSize: "10px",
                          marginTop: "2px",
                          backgroundColor: "var(--bg-secondary, #f6f8fa)",
                          color: "var(--text-secondary, #656d76)"
                        }}
                      >
                        {run.event}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {run.actor?.avatarUrl && (
                          <img
                            src={run.actor.avatarUrl}
                            alt={run.actor.login}
                            style={{ width: "20px", height: "20px", borderRadius: "50%" }}
                          />
                        )}
                        <span style={{ fontSize: "12px" }}>{run.actor?.login}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                      {run.durationFormatted}
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--text-secondary, #586069)", textAlign: "right", whiteSpace: "nowrap" }}>
                      {timeAgo(run.updatedAt || run.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "28px", color: "var(--text-secondary, #586069)" }}>
                    No workflow runs match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
