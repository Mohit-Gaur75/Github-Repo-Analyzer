import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSecurity } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import { getScoreColor } from "../utils/helpers";

function Security() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSecurity(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Analyzing security..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

  const checks = [
    { key: "hasSecurityPolicy", label: "Security Policy (SECURITY.md)", icon: "🛡️" },
    { key: "hasDependabot", label: "Dependabot configured", icon: "🤖" },
    { key: "hasEnvExample", label: ".env.example present", icon: "📝" },
    { key: "hasGitignore", label: ".gitignore present", icon: "🚫" },
    { key: "noEnvFileExposed", label: "No .env file exposed", icon: "🔐" }
  ];

  const riskColors = { critical: "#dc3545", high: "#fd7e14", medium: "#ffc107", low: "#17a2b8" };
  const ratingColor = { Good: "#28a745", Fair: "#ffc107", Poor: "#fd7e14", Critical: "#dc3545" };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔒 Security</h1>
        <p className="page-subtitle">{owner}/{repo} — Security analysis</p>
      </div>

      <RepoNav />

      <div className="grid-3" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">🔒</div>
          <div className="stat-value" style={{ color: getScoreColor(data.securityScore) }}>
            {data.securityScore}%
          </div>
          <div className="stat-label">Security Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value" style={{ color: ratingColor[data.securityRating] }}>
            {data.securityRating}
          </div>
          <div className="stat-label">Security Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value" style={{ color: data.risks?.length > 0 ? "#dc3545" : "#28a745" }}>
            {data.risks?.length || 0}
          </div>
          <div className="stat-label">Risks Found</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: "24px" }}>
        <div className="card">
          <h3 className="card-title">🛡️ Security Checklist</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {checks.map((check) => (
              <div key={check.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "8px", backgroundColor: data.securityChecks[check.key] ? "#f0fff4" : "#fff5f5", border: `1px solid ${data.securityChecks[check.key] ? "#c6f6d5" : "#fed7d7"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "18px" }}>{check.icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>{check.label}</span>
                </div>
                <span style={{ fontSize: "18px" }}>{data.securityChecks[check.key] ? "✅" : "❌"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">⚠️ Risk Analysis</h3>
          {data.risks?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#28a745" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
              <p style={{ fontWeight: "600" }}>No security risks detected!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.risks?.map((risk, i) => (
                <div key={i} style={{ padding: "12px", borderRadius: "8px", border: `1px solid ${riskColors[risk.severity]}33`, backgroundColor: `${riskColors[risk.severity]}11` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "14px" }}>{risk.type}</strong>
                    <span className="badge" style={{ backgroundColor: `${riskColors[risk.severity]}22`, color: riskColors[risk.severity] }}>
                      {risk.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#586069", margin: 0 }}>{risk.description}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: "20px" }}>
            <h4 style={{ marginBottom: "12px", fontSize: "15px" }}>💡 Recommendations</h4>
            {data.recommendations?.map((rec, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", padding: "10px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", marginBottom: "8px" }}>
                <span>💡</span>
                <span style={{ fontSize: "13px" }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Security;