import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getIssues } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import { timeAgo } from "../utils/helpers";

function Issues() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("open");

  useEffect(() => {
    getIssues(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Loading issues..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

  const healthColor = { Excellent: "#28a745", Good: "#28a745", Fair: "#ffc107", "Needs Attention": "#dc3545" };
  const issues = tab === "open" ? data.openIssues : data.closedIssues;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🐛 Issues</h1>
        <p className="page-subtitle">{owner}/{repo} — Issue tracker analysis</p>
      </div>

      <RepoNav />

      <div className="grid-4" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-value" style={{ color: "#dc3545" }}>{data.totalOpen}</div>
          <div className="stat-label">Open Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value" style={{ color: "#28a745" }}>{data.totalClosed}</div>
          <div className="stat-label">Closed Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{data.closeRate}%</div>
          <div className="stat-label">Close Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱</div>
          <div className="stat-value">{data.avgCloseTimeDays}d</div>
          <div className="stat-label">Avg Close Time</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="card-title" style={{ margin: 0 }}>Issue Health</h3>
          <span className="badge" style={{ backgroundColor: healthColor[data.issueHealth] + "22", color: healthColor[data.issueHealth] }}>
            {data.issueHealth}
          </span>
        </div>
        <div className="progress-bar" style={{ height: "12px" }}>
          <div className="progress-fill" style={{ width: `${data.closeRate}%`, backgroundColor: "#28a745" }} />
        </div>
        <p style={{ fontSize: "13px", color: "#586069", marginTop: "8px" }}>
          {data.closeRate}% of all issues have been resolved
        </p>
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
                <th>Labels</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td style={{ color: "#586069", fontSize: "13px" }}>#{issue.id}</td>
                  <td>
                    <a href={issue.url} target="_blank" rel="noreferrer" style={{ color: "#0366d6", textDecoration: "none", fontSize: "14px" }}>
                      {issue.title?.substring(0, 70)}{issue.title?.length > 70 ? "..." : ""}
                    </a>
                  </td>
                  <td style={{ fontSize: "13px", color: "#586069" }}>{issue.author}</td>
                  <td>
                    {issue.labels?.slice(0, 3).map((l) => (
                      <span key={l} className="badge badge-secondary" style={{ margin: "2px", fontSize: "11px" }}>{l}</span>
                    ))}
                  </td>
                  <td style={{ fontSize: "13px", color: "#586069", whiteSpace: "nowrap" }}>
                    {tab === "closed" ? timeAgo(issue.closedAt) : timeAgo(issue.createdAt)}
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

export default Issues;