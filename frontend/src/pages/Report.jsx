import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getExecutiveReport } from "../api/apiService";
import { formatNumber } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";

function Report() {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    getExecutiveReport(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    if (!data) return;
    const md = `# 📑 Executive Repository Audit Report: ${data.repo.fullName}
**Report ID**: \`${data.reportId}\`  
**Audit Date**: ${new Date(data.generatedAt).toLocaleDateString()}  
**Repository**: ${data.repo.url}  

---

## 🏆 Overall Health & Compliance Grade: **${data.scores.overallGrade}** (${data.scores.overallScore} / 100)
- **Quality & Health Score**: ${data.scores.healthScore}% (${data.scores.healthGrade})
- **Security & CVE Score**: ${data.scores.securityScore}% (${data.scores.securityRating})
- **Community Resilience**: ${data.scores.resilienceScore}% (${data.scores.resilienceStatus})

---

## 🛠️ Architecture & Tech Stack
- **Architecture**: ${data.techStack.summary}
- **Primary Language**: ${data.repo.primaryLanguage}
- **Key Technologies**: ${data.techStack.mainTechnologies.join(", ")}

---

## 🔒 Security Posture & Vulnerabilities
- **Security Rating**: ${data.securityAudit.rating}
- **Known CVEs Detected**: ${data.securityAudit.knownCVEs}
- **Security Risks Found**: ${data.securityAudit.risksCount}

---

## 👥 Community Governance & Bus Factor
- **Bus Factor Score**: ${data.governance.busFactor} (${data.governance.riskLevel})
- **Total Contributors**: ${formatNumber(data.governance.totalContributors)}
- **Gini Inequality Index**: ${data.governance.giniIndex}
- **Key Maintainers**: ${data.governance.keyMaintainers.join(", ") || "None"}

---

## 🚀 Shipping Velocity & Release Cadence
- **Latest Version**: ${data.shipping.latestVersion}
- **Shipping Cadence**: ${data.shipping.cadenceStatus}
- **Average Release Interval**: ${data.shipping.avgDaysBetweenReleases ? `~${data.shipping.avgDaysBetweenReleases} days` : "N/A"}

---

## 💡 Executive Action Items
${data.recommendations.map((r, i) => `${i + 1}. **[${r.priority}] ${r.area}**: ${r.action}`).join("\n")}

---
*Report generated automatically by GitHub Repo Analyzer Platform.*
`;

    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-report-${owner}-${repo}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner message="Generating executive repository audit report..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div>
      {/* Top Action Bar (Hidden during print) */}
      <div className="no-print" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <div>
            <button
              onClick={() => navigate(`/dashboard/${owner}/${repo}`)}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: "600" }}
            >
              ← Back to Dashboard
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={handlePrint} className="btn btn-primary btn-sm" style={{ fontWeight: "700" }}>
              🖨️ Print / Save as PDF
            </button>
            <button onClick={handleCopyMarkdown} className="btn btn-secondary btn-sm" style={{ fontWeight: "600" }}>
              {copied ? "✅ Copied Markdown!" : "📋 Copy Markdown"}
            </button>
            <button onClick={handleDownloadJSON} className="btn btn-secondary btn-sm" style={{ fontWeight: "600" }}>
              💾 Export JSON
            </button>
          </div>
        </div>

        <RepoNav />
      </div>

      {/* Printable Report Canvas */}
      <div
        className="report-canvas card"
        style={{
          padding: "36px",
          backgroundColor: "#ffffff",
          maxWidth: "960px",
          margin: "0 auto 30px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
          border: "1px solid #e1e4e8"
        }}
      >
        {/* Document Header */}
        <div style={{ borderBottom: "2px solid #0366d6", paddingBottom: "20px", marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#0366d6", letterSpacing: "1px", marginBottom: "4px" }}>
                EXECUTIVE AUDIT REPORT
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 6px", color: "#24292e" }}>
                {data.repo.fullName}
              </h1>
              <p style={{ fontSize: "14px", color: "#586069", margin: 0, maxWidth: "600px" }}>
                {data.repo.description}
              </p>
            </div>

            <div style={{ textAlign: "right", fontSize: "12px", color: "#586069" }}>
              <div>Report ID: <code style={{ color: "#0366d6", fontWeight: "700" }}>{data.reportId}</code></div>
              <div style={{ marginTop: "2px" }}>Generated: {new Date(data.generatedAt).toLocaleDateString()}</div>
              <div style={{ marginTop: "2px" }}>License: <strong>{data.repo.license}</strong></div>
            </div>
          </div>
        </div>

        {/* Executive Scorecard Matrix */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          {/* Overall Grade Card */}
          <div style={{ padding: "18px", borderRadius: "10px", background: "#f0f7ff", border: "1px solid #c8e1ff", textAlign: "center" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#0366d6", textTransform: "uppercase" }}>Overall Grade</div>
            <div style={{ fontSize: "40px", fontWeight: "900", color: "#0366d6", margin: "4px 0" }}>
              {data.scores.overallGrade}
            </div>
            <div style={{ fontSize: "12px", color: "#586069", fontWeight: "600" }}>
              Composite: {data.scores.overallScore} / 100
            </div>
          </div>

          {/* Quality & Health */}
          <div style={{ padding: "18px", borderRadius: "10px", background: "#f6ffed", border: "1px solid #b7eb8f", textAlign: "center" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#389e0d", textTransform: "uppercase" }}>Code Quality</div>
            <div style={{ fontSize: "40px", fontWeight: "900", color: "#389e0d", margin: "4px 0" }}>
              {data.scores.healthScore}%
            </div>
            <div style={{ fontSize: "12px", color: "#586069", fontWeight: "600" }}>
              Rating: {data.scores.healthGrade}
            </div>
          </div>

          {/* Security Score */}
          <div style={{ padding: "18px", borderRadius: "10px", background: "#fff7e6", border: "1px solid #ffd591", textAlign: "center" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#d46b08", textTransform: "uppercase" }}>Security & CVE</div>
            <div style={{ fontSize: "40px", fontWeight: "900", color: "#d46b08", margin: "4px 0" }}>
              {data.scores.securityScore}%
            </div>
            <div style={{ fontSize: "12px", color: "#586069", fontWeight: "600" }}>
              CVE Grade: {data.scores.cveGrade}
            </div>
          </div>

          {/* Governance & Resilience */}
          <div style={{ padding: "18px", borderRadius: "10px", background: "#f9f0ff", border: "1px solid #d3adf7", textAlign: "center" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#531dab", textTransform: "uppercase" }}>Resilience</div>
            <div style={{ fontSize: "40px", fontWeight: "900", color: "#531dab", margin: "4px 0" }}>
              {data.scores.resilienceScore}%
            </div>
            <div style={{ fontSize: "12px", color: "#586069", fontWeight: "600" }}>
              Bus Factor: {data.governance.busFactor}
            </div>
          </div>
        </div>

        {/* Section 1: Architecture & Technology */}
        <div style={{ marginBottom: "26px", pageBreakInside: "avoid" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid #e1e4e8", paddingBottom: "8px", marginBottom: "12px" }}>
            1. Architecture & Technology Blueprint
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
            <div>
              <p style={{ margin: "0 0 6px" }}><strong>Architecture:</strong> {data.techStack.summary}</p>
              <p style={{ margin: "0 0 6px" }}><strong>Classification:</strong> {data.techStack.archType}</p>
              <p style={{ margin: 0 }}><strong>Primary Language:</strong> {data.repo.primaryLanguage}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 6px" }}><strong>Repository Age:</strong> {data.repo.ageInYears} years</p>
              <p style={{ margin: "0 0 6px" }}><strong>Codebase Size:</strong> {data.repo.sizeMB} MB</p>
              <p style={{ margin: 0 }}><strong>Core Technologies:</strong> {data.techStack.mainTechnologies.join(", ") || "None detected"}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Security & Vulnerabilities */}
        <div style={{ marginBottom: "26px", pageBreakInside: "avoid" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid #e1e4e8", paddingBottom: "8px", marginBottom: "12px" }}>
            2. Security Posture & Vulnerabilities Status
          </h3>
          <div style={{ display: "flex", gap: "24px", fontSize: "13px", marginBottom: "10px", flexWrap: "wrap" }}>
            <div>Security Posture: <strong>{data.securityAudit.rating}</strong></div>
            <div>Known CVEs Detected: <strong>{data.securityAudit.knownCVEs}</strong></div>
            <div>Flagged Risks: <strong>{data.securityAudit.risksCount}</strong></div>
            <div>Scanned Manifest: <strong>{data.securityAudit.scannedManifest}</strong></div>
          </div>

          {data.securityAudit.topRisks.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#586069", marginBottom: "6px" }}>NOTABLE RISKS:</div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#333" }}>
                {data.securityAudit.topRisks.map((r, i) => (
                  <li key={i} style={{ marginBottom: "4px" }}>
                    <span style={{ fontWeight: "700", color: r.severity === "critical" ? "#dc3545" : "#fd7e14" }}>
                      [{r.severity.toUpperCase()}]
                    </span>{" "}
                    <strong>{r.type}</strong>: {r.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Section 3: Community Governance & Bus Factor */}
        <div style={{ marginBottom: "26px", pageBreakInside: "avoid" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid #e1e4e8", paddingBottom: "8px", marginBottom: "12px" }}>
            3. Community Governance & Maintainer Risk
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
            <div>
              <p style={{ margin: "0 0 6px" }}>
                <strong>Bus Factor:</strong> {data.governance.busFactor} ({data.governance.riskLevel})
              </p>
              <p style={{ margin: 0 }}>
                <strong>Total Contributors:</strong> {formatNumber(data.governance.totalContributors)}
              </p>
            </div>
            <div>
              <p style={{ margin: "0 0 6px" }}>
                <strong>Gini Inequality Index:</strong> {data.governance.giniIndex} / 1.00
              </p>
              <p style={{ margin: 0 }}>
                <strong>Key Maintainers:</strong> {data.governance.keyMaintainers.join(", ") || "Distributed"}
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Release Cadence & Shipping Velocity */}
        <div style={{ marginBottom: "26px", pageBreakInside: "avoid" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid #e1e4e8", paddingBottom: "8px", marginBottom: "12px" }}>
            4. Release Cadence & Shipping Velocity
          </h3>
          <div style={{ display: "flex", gap: "24px", fontSize: "13px", flexWrap: "wrap" }}>
            <div>Latest Release: <strong>{data.shipping.latestVersion}</strong></div>
            <div>Shipping Cadence: <strong>{data.shipping.cadenceStatus}</strong></div>
            <div>Total Releases Published: <strong>{data.shipping.totalReleases}</strong></div>
          </div>
        </div>

        {/* Section 5: Remediation Roadmap */}
        <div style={{ marginBottom: "24px", pageBreakInside: "avoid" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid #e1e4e8", paddingBottom: "8px", marginBottom: "12px" }}>
            5. Prioritized Executive Remediation Roadmap
          </h3>
          {data.recommendations.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#28a745" }}>
              ✅ No critical remediation actions required. The repository is in strong health across all evaluated dimensions.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {data.recommendations.map((rec, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e1e4e8",
                    fontSize: "13px"
                  }}
                >
                  <span
                    className="badge"
                    style={{
                      backgroundColor: rec.priority === "HIGH" ? "#dc3545" : rec.priority === "MEDIUM" ? "#f4a900" : "#0366d6",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: "700"
                    }}
                  >
                    {rec.priority}
                  </span>
                  <div>
                    <strong>{rec.area}:</strong> {rec.action}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Footer */}
        <div
          style={{
            borderTop: "1px solid #e1e4e8",
            paddingTop: "16px",
            marginTop: "30px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "#959da5"
          }}
        >
          <span>Automated Audit by GitHub Repo Analyzer Platform</span>
          <span>Certified Document Hash: {data.reportId}</span>
        </div>
      </div>

      {/* Print CSS Rules */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print, nav, .app > nav, header {
            display: none !important;
          }
          .main-content {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .report-canvas {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          @page {
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}

export default Report;
