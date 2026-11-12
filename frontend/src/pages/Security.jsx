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
  const [severityFilter, setSeverityFilter] = useState("ALL");

  useEffect(() => {
    setLoading(true);
    setError("");
    getSecurity(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Scanning security configuration & dependencies (OSV CVE database)..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
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

  const cveScan = data.cveScan || {};
  const allVulns = cveScan.vulnerabilities || [];
  const filteredVulns = severityFilter === "ALL"
    ? allVulns
    : allVulns.filter((v) => v.severity === severityFilter);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔒 Deep Security & CVE Scanner</h1>
        <p className="page-subtitle">
          {owner}/{repo} — Security posture, sensitive files check & OSV.dev dependency vulnerabilities
        </p>
      </div>

      <RepoNav />

      {/* Top Stat Cards */}
      <div className="grid-4" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">🔒</div>
          <div className="stat-value" style={{ color: getScoreColor(data.securityScore) }}>
            {data.securityScore}%
          </div>
          <div className="stat-label">Overall Security Score</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-value" style={{ color: ratingColor[data.securityRating] || "#0366d6" }}>
            {data.securityRating}
          </div>
          <div className="stat-label">Posture Rating</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value" style={{ color: (cveScan.vulnerabilities?.length || 0) > 0 ? "#dc3545" : "#28a745" }}>
            {cveScan.vulnerabilities?.length || 0}
          </div>
          <div className="stat-label">Known CVEs Found</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏅</div>
          <div className="stat-value" style={{ color: cveScan.grade === "A+" || cveScan.grade === "B" ? "#28a745" : "#dc3545" }}>
            {cveScan.grade || "A+"}
          </div>
          <div className="stat-label">Dependency CVE Grade</div>
        </div>
      </div>

      {/* Manifest Scan Info Banner */}
      <div
        className="card"
        style={{
          marginBottom: "24px",
          padding: "16px 20px",
          backgroundColor: cveScan.hasManifest ? "#f6f8fa" : "#fff8e1",
          borderLeft: cveScan.hasManifest ? "4px solid #0366d6" : "4px solid #f4a900",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div>
          <div style={{ fontWeight: "700", fontSize: "14px", color: "#24292e" }}>
            {cveScan.hasManifest
              ? `📦 Scanned ${cveScan.scannedCount} packages from ${cveScan.manifestType} (${cveScan.ecosystem})`
              : "ℹ️ No package.json or requirements.txt detected in root"}
          </div>
          <div style={{ fontSize: "12px", color: "#586069", marginTop: "2px" }}>
            Powered by <strong>Open Source Vulnerabilities (OSV.dev)</strong> database · Last scanned {new Date().toLocaleTimeString()}
          </div>
        </div>

        {cveScan.hasManifest && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span className="badge" style={{ backgroundColor: "#dc3545", color: "#fff" }}>
              Critical: {cveScan.stats?.critical || 0}
            </span>
            <span className="badge" style={{ backgroundColor: "#fd7e14", color: "#fff" }}>
              High: {cveScan.stats?.high || 0}
            </span>
            <span className="badge" style={{ backgroundColor: "#ffc107", color: "#24292e" }}>
              Medium: {cveScan.stats?.medium || 0}
            </span>
            <span className="badge" style={{ backgroundColor: "#17a2b8", color: "#fff" }}>
              Low: {cveScan.stats?.low || 0}
            </span>
          </div>
        )}
      </div>

      {/* CVE Vulnerabilities List */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            🚨 Dependency Vulnerabilities ({filteredVulns.length})
          </h3>

          {/* Severity filter buttons */}
          {allVulns.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverityFilter(level)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "14px",
                    border: "1px solid #ced4da",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                    backgroundColor: severityFilter === level ? "#24292e" : "#f6f8fa",
                    color: severityFilter === level ? "#ffffff" : "#586069"
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          )}
        </div>

        {allVulns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#28a745" }}>
            <div style={{ fontSize: "44px", marginBottom: "10px" }}>🛡️</div>
            <h4 style={{ margin: "0 0 6px" }}>Zero Vulnerabilities Found!</h4>
            <p style={{ color: "#586069", fontSize: "13px", margin: 0 }}>
              All inspected dependencies matched against OSV.dev currently have no active CVE advisories.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredVulns.map((v, idx) => {
              const badgeColor = riskColors[v.severity.toLowerCase()] || "#586069";
              return (
                <div
                  key={`${v.id}-${idx}`}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    border: `1px solid ${badgeColor}44`,
                    backgroundColor: `${badgeColor}08`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <div>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: badgeColor,
                          color: "#ffffff",
                          fontWeight: "700",
                          marginRight: "8px"
                        }}
                      >
                        {v.severity}
                      </span>
                      <strong style={{ fontSize: "15px", color: "#24292e" }}>
                        {v.packageName}
                      </strong>
                      <span style={{ fontSize: "13px", color: "#586069", marginLeft: "6px" }}>
                        installed: <code>{v.installedVersion}</code>
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#0366d6", fontWeight: "700" }}>
                        {v.cve}
                      </span>
                      <a
                        href={v.advisoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "3px 8px", fontSize: "11px" }}
                      >
                        Advisory ↗
                      </a>
                    </div>
                  </div>

                  <p style={{ fontSize: "13px", color: "#333", margin: "0 0 10px", lineHeight: "1.5" }}>
                    {v.summary}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#586069", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "8px" }}>
                    <span>
                      🛠️ Recommended fix: <strong>{v.fixedVersion}</strong>
                    </span>
                    {v.publishedAt && (
                      <span>Published: {new Date(v.publishedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security Checklist & Risk Analysis Grid */}
      <div className="grid-2" style={{ marginBottom: "24px" }}>
        {/* Checklist */}
        <div className="card">
          <h3 className="card-title">🛡️ Security Best Practices Checklist</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {checks.map((check) => (
              <div
                key={check.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: data.securityChecks[check.key] ? "#f0fff4" : "#fff5f5",
                  border: `1px solid ${data.securityChecks[check.key] ? "#c6f6d5" : "#fed7d7"}`
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "18px" }}>{check.icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>{check.label}</span>
                </div>
                <span style={{ fontSize: "18px" }}>{data.securityChecks[check.key] ? "✅" : "❌"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="card">
          <h3 className="card-title">💡 Actionable Security Remediation</h3>
          {data.recommendations?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#28a745" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>🎉</div>
              <p style={{ fontWeight: "600", margin: 0 }}>All standard security checks are in place!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.recommendations?.map((rec, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "10px",
                    padding: "12px",
                    backgroundColor: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: "8px",
                    alignItems: "flex-start"
                  }}
                >
                  <span style={{ fontSize: "16px" }}>💡</span>
                  <span style={{ fontSize: "13px", color: "#856404", lineHeight: "1.5" }}>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Security;
