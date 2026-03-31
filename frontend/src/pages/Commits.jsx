import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCommits } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import { formatNumber, formatDate, timeAgo } from "../utils/helpers";

function Commits() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCommits(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Loading commit history..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;


  if (!data.dataAvailable) {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📝 Commits</h1>
        <p className="page-subtitle">{owner}/{repo}</p>
      </div>
      <RepoNav />
      <div className="card" style={{ textAlign: "center", padding: "60px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <h3 style={{ marginBottom: "12px" }}>GitHub is computing stats</h3>
        <p style={{ color: "#586069", marginBottom: "24px" }}>
          GitHub needs a moment to calculate commit statistics for this repository.
          Please wait 10–15 seconds and try again.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📝 Commits</h1>
        <p className="page-subtitle">{owner}/{repo} — Commit activity</p>
      </div>

      <RepoNav />

      <div className="grid-3" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{formatNumber(data.totalCommitsLastYear)}</div>
          <div className="stat-label">Commits (Last Year)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{data.averageCommitsPerWeek}</div>
          <div className="stat-label">Avg Commits / Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{data.activeDays}</div>
          <div className="stat-label">Active Days</div>
        </div>
      </div>

      {/* Weekly activity chart */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 className="card-title">📊 Weekly Commit Activity (Last 52 Weeks)</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "80px", overflowX: "auto", padding: "8px 0" }}>
          {(data.weeklyActivity || []).map((week, i) => {
            const max = Math.max(...(data.weeklyActivity || []).map((w) => w.total || 0), 1);
            const height = Math.max(4, ((week.total || 0) / max) * 70);
            return (
              <div
                key={i}
                title={`Week ${i + 1}: ${week.total} commits`}
                style={{
                  flex: "0 0 10px",
                  height: `${height}px`,
                  backgroundColor: week.total > 0 ? "#0366d6" : "#e1e4e8",
                  borderRadius: "2px",
                  opacity: week.total > 0 ? 0.7 + (week.total / Math.max(...(data.weeklyActivity || []).map((w) => w.total || 0), 1)) * 0.3 : 1,
                  cursor: "pointer"
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Recent commits */}
      <div className="card">
        <h3 className="card-title">🕐 Recent Commits</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SHA</th>
                <th>Message</th>
                <th>Author</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentCommits || []).map((commit) => (
                <tr key={commit.sha}>
                  <td>
                    <a href={commit.url} target="_blank" rel="noreferrer" style={{ color: "#0366d6", fontFamily: "monospace", fontSize: "13px" }}>
                      {commit.sha}
                    </a>
                  </td>
                  <td style={{ maxWidth: "400px" }}>
                    <span style={{ fontSize: "14px" }}>{commit.message?.substring(0, 80)}{commit.message?.length > 80 ? "..." : ""}</span>
                  </td>
                  <td style={{ fontSize: "13px", color: "#586069" }}>{commit.author}</td>
                  <td style={{ fontSize: "13px", color: "#586069", whiteSpace: "nowrap" }}>{timeAgo(commit.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Commits;