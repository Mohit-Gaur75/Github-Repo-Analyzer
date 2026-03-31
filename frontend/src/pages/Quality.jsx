import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getQuality } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import { getScoreColor } from "../utils/helpers";

function Quality() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getQuality(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Analyzing quality..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

  const checks = [
    { key: "hasReadme", label: "README file", icon: "📖" },
    { key: "hasLicense", label: "License file", icon: "📄" },
    { key: "hasContributing", label: "Contributing guide", icon: "🤝" },
    { key: "hasChangelog", label: "Changelog", icon: "📋" },
    { key: "hasCodeOfConduct", label: "Code of Conduct", icon: "⚖️" },
    { key: "hasCICD", label: "CI/CD Workflows", icon: "🔄" },
    { key: "hasTests", label: "Test directory", icon: "🧪" },
    { key: "hasDocker", label: "Docker support", icon: "🐳" }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">✅ Quality</h1>
        <p className="page-subtitle">{owner}/{repo} — Code quality analysis</p>
      </div>

      <RepoNav />

      <div className="grid-3" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value" style={{ color: getScoreColor(data.qualityScore) }}>
            {data.qualityScore}%
          </div>
          <div className="stat-label">Quality Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-value" style={{ color: getScoreColor(data.healthScore) }}>
            {data.healthScore}
          </div>
          <div className="stat-label">Health Score (Grade: {data.healthGrade})</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{data.passedChecks}/{data.totalChecks}</div>
          <div className="stat-label">Checks Passed</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: "24px" }}>
        <div className="card">
          <h3 className="card-title">📋 Quality Checklist</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {checks.map((check) => (
              <div key={check.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "8px", backgroundColor: data.checks[check.key] ? "#f0fff4" : "#fff5f5", border: `1px solid ${data.checks[check.key] ? "#c6f6d5" : "#fed7d7"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "18px" }}>{check.icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>{check.label}</span>
                </div>
                <span style={{ fontSize: "18px" }}>{data.checks[check.key] ? "✅" : "❌"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">💡 Recommendations</h3>
          {data.recommendations?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#28a745" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
              <p style={{ fontWeight: "600" }}>All quality checks passed!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.recommendations?.map((rec, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", padding: "12px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px" }}>
                  <span>💡</span>
                  <span style={{ fontSize: "14px" }}>{rec}</span>
                </div>
              ))}
            </div>
          )}

          {data.workflows?.total > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ marginBottom: "12px", fontSize: "15px" }}>🔄 CI/CD Workflows ({data.workflows.total})</h4>
              {data.workflows.items?.map((w) => (
                <div key={w.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e1e4e8", fontSize: "14px" }}>
                  <span>{w.name}</span>
                  <span className={`badge ${w.state === "active" ? "badge-success" : "badge-secondary"}`}>{w.state}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Quality;