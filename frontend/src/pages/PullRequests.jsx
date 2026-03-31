import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPullRequests } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import { timeAgo } from "../utils/helpers";

function PullRequests() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("open");

  useEffect(() => {
    getPullRequests(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Loading pull requests..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

  const prs = tab === "open" ? data.openPRs : data.closedPRs;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔀 Pull Requests</h1>
        <p className="page-subtitle">{owner}/{repo} — PR analysis</p>
      </div>

      <RepoNav />

      <div className="grid-4" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-value" style={{ color: "#dc3545" }}>{data.totalOpen}</div>
          <div className="stat-label">Open PRs</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟣</div>
          <div className="stat-value" style={{ color: "#6f42c1" }}>{data.totalMerged}</div>
          <div className="stat-label">Merged</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{data.mergeRate}%</div>
          <div className="stat-label">Merge Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱</div>
          <div className="stat-value">{data.avgMergeTimeDays}d</div>
          <div className="stat-label">Avg Merge Time</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button
            className={`btn ${tab === "open" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("open")}
          >
            🔴 Open ({data.totalOpen})
          </button>
          <button
            className={`btn ${tab === "closed" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("closed")}
          >
            ✅ Closed ({data.totalClosed})
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {prs.map((pr) => (
                <tr key={pr.id}>
                  <td style={{ color: "#586069", fontSize: "13px" }}>#{pr.id}</td>
                  <td>
                    <a href={pr.url} target="_blank" rel="noreferrer" style={{ color: "#0366d6", textDecoration: "none", fontSize: "14px" }}>
                      {pr.title?.substring(0, 70)}{pr.title?.length > 70 ? "..." : ""}
                    </a>
                    {pr.draft && <span className="badge badge-secondary" style={{ marginLeft: "6px", fontSize: "11px" }}>Draft</span>}
                  </td>
                  <td style={{ fontSize: "13px", color: "#586069" }}>{pr.author}</td>
                  <td>
                    {tab === "closed"
                      ? pr.merged
                        ? <span className="badge badge-success">Merged</span>
                        : <span className="badge badge-danger">Closed</span>
                      : <span className="badge badge-info">Open</span>}
                  </td>
                  <td style={{ fontSize: "13px", color: "#586069", whiteSpace: "nowrap" }}>
                    {tab === "closed" ? timeAgo(pr.closedAt) : timeAgo(pr.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PullRequests;