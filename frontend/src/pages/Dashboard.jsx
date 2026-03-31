import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRepoDetails } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import StatCard from "../components/StatCard";
import { formatNumber, formatDate, timeAgo } from "../utils/helpers";

function Dashboard() {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getRepoDetails(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Fetching repository details..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div>
      {/* Repo Header */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
          <img
            src={data.owner?.avatar}
            alt={data.owner?.login}
            style={{ width: "64px", height: "64px", borderRadius: "50%", border: "2px solid #e1e4e8" }}
          />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "6px" }}>
              <a href={data.url} target="_blank" rel="noreferrer" style={{ color: "#0366d6", textDecoration: "none" }}>
                {data.fullName}
              </a>
            </h1>
            <p style={{ color: "#586069", fontSize: "15px", marginBottom: "12px" }}>
              {data.description || "No description provided"}
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {data.language && <span className="badge badge-info">🌐 {data.language}</span>}
              {data.license && <span className="badge badge-secondary">📄 {data.license}</span>}
              {data.isArchived && <span className="badge badge-warning">📦 Archived</span>}
              {data.isFork && <span className="badge badge-secondary">🍴 Fork</span>}
              {data.visibility && <span className="badge badge-secondary">👁 {data.visibility}</span>}
            </div>
            {data.topics?.length > 0 && (
              <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {data.topics.map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: "24px" }}>
        <StatCard icon="⭐" value={formatNumber(data.stars)} label="Stars" color="#f4a900" />
        <StatCard icon="🍴" value={formatNumber(data.forks)} label="Forks" color="#0366d6" />
        <StatCard icon="👁" value={formatNumber(data.watchers)} label="Watchers" color="#28a745" />
        <StatCard icon="🐛" value={formatNumber(data.openIssuesCount)} label="Open Issues" color="#dc3545" />
      </div>

      {/* Repo Nav */}
      <RepoNav />

      {/* Info Cards */}
      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">📋 Repository Info</h3>
          <table style={{ width: "100%", fontSize: "14px" }}>
            <tbody>
              {[
                ["Default Branch", data.defaultBranch],
                ["Created", formatDate(data.createdAt)],
                ["Last Updated", timeAgo(data.updatedAt)],
                ["Last Push", timeAgo(data.pushedAt)],
                ["Size", `${(data.size / 1024).toFixed(1)} MB`],
                ["Has Issues", data.hasIssues ? "✅ Yes" : "❌ No"]
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: "8px 0", color: "#586069", fontWeight: "500" }}>{k}</td>
                  <td style={{ padding: "8px 0", textAlign: "right" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="card-title">👤 Owner Info</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src={data.owner?.avatar} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%" }} />
              <div>
                <div style={{ fontWeight: "700" }}>{data.owner?.login}</div>
                <a href={data.owner?.url} target="_blank" rel="noreferrer" style={{ color: "#0366d6", fontSize: "13px" }}>
                  View on GitHub →
                </a>
              </div>
            </div>
          </div>
          <div style={{ marginTop: "20px" }}>
            <h4 style={{ marginBottom: "12px", fontSize: "15px" }}>🚀 Quick Analysis</h4>
            {[
              { label: "Languages", path: `/languages/${owner}/${repo}` },
              { label: "Commits", path: `/commits/${owner}/${repo}` },
              { label: "Contributors", path: `/contributors/${owner}/${repo}` },
              { label: "Security", path: `/security/${owner}/${repo}` }
            ].map((item) => (
              <button
                key={item.label}
                className="btn btn-secondary btn-sm"
                style={{ margin: "4px" }}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;