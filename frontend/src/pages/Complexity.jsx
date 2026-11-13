import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getCodeComplexity } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import StatCard from "../components/StatCard";
import { formatNumber } from "../utils/helpers";

function Complexity() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterQuadrant, setFilterQuadrant] = useState("all");
  const [hoveredFile, setHoveredFile] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    getCodeComplexity(owner, repo)
      .then((res) => setData(res.data?.data || res.data))
      .catch((err) => setError(err.message || "Failed to load code complexity metrics"))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  const filteredCandidates = useMemo(() => {
    if (!data?.topCandidates) return [];
    if (filterQuadrant === "all") return data.topCandidates;
    return data.topCandidates.filter((c) => c.quadrant === filterQuadrant);
  }, [data, filterQuadrant]);

  if (loading) return <LoadingSpinner message="Scanning codebase structure, file churn, and complexity metrics..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1 className="page-title">🗺️ Code Complexity & Hotspots Map</h1>
        <p className="page-subtitle">
          File-level structural complexity and modification churn analysis. Identifies technical debt and high-risk hotspots.
        </p>
      </div>

      <RepoNav />

      {/* Overview Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          icon="📁"
          value={formatNumber(data.totalFilesAnalyzed)}
          label="Source Files"
          color="#0366d6"
        />
        <StatCard
          icon="📏"
          value={formatNumber(data.totalEstimatedLOC)}
          label="Estimated LOC"
          color="#6f42c1"
        />
        <StatCard
          icon="⚠️"
          value={data.quadrantCounts.danger}
          label="Danger Hotspots"
          color="#dc3545"
        />
        <StatCard
          icon="🧠"
          value={`${data.averageComplexity} / 100`}
          label={`Complexity (${data.overallRating.level})`}
          color={data.overallRating.color}
        />
      </div>

      {/* Quadrants Summary Banner */}
      <div className="card" style={{ marginBottom: 24, padding: "16px 20px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
          🧭 Codebase Quadrant Distribution
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div style={{
            padding: "12px 14px", borderRadius: 8,
            background: "rgba(220, 53, 69, 0.08)", border: "1px solid rgba(220, 53, 69, 0.2)"
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#dc3545", marginBottom: 4 }}>
              🔴 Danger Zone ({data.quadrantCounts.danger})
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              High Churn + High Complexity. Most prone to regression bugs during frequent edits.
            </div>
          </div>

          <div style={{
            padding: "12px 14px", borderRadius: 8,
            background: "rgba(244, 169, 0, 0.08)", border: "1px solid rgba(244, 169, 0, 0.2)"
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f4a900", marginBottom: 4 }}>
              🟡 Technical Debt ({data.quadrantCounts.debt})
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              High Complexity + Low Churn. Large or fragile legacy modules avoided by contributors.
            </div>
          </div>

          <div style={{
            padding: "12px 14px", borderRadius: 8,
            background: "rgba(3, 102, 214, 0.08)", border: "1px solid rgba(3, 102, 214, 0.2)"
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>
              🔵 Active Work ({data.quadrantCounts.active})
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              High Churn + Low Complexity. Frequently iterated utility components and configurations.
            </div>
          </div>

          <div style={{
            padding: "12px 14px", borderRadius: 8,
            background: "rgba(40, 167, 69, 0.08)", border: "1px solid rgba(40, 167, 69, 0.2)"
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#28a745", marginBottom: 4 }}>
              🟢 Stable ({data.quadrantCounts.stable})
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Low Churn + Low Complexity. Reliable, modular, and low-maintenance core logic.
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 2D Scatter Matrix */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              📊 Churn vs. Complexity Matrix
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              X-axis: Modification Churn (0-100) · Y-axis: Structural Complexity (0-100). Hover points to inspect files.
            </p>
          </div>
          {hoveredFile && (
            <div style={{
              padding: "6px 12px", borderRadius: 6,
              background: "var(--bg-tertiary)", border: "1px solid var(--border)",
              fontSize: 12, color: "var(--text-primary)"
            }}>
              <strong>{hoveredFile.path}</strong> · {hoveredFile.loc} LOC (Churn: {hoveredFile.churn}, Complexity: {hoveredFile.complexity})
            </div>
          )}
        </div>

        {/* SVG Matrix */}
        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg
            viewBox="0 0 600 340"
            style={{ width: "100%", maxWidth: 800, height: "auto", display: "block", margin: "0 auto" }}
          >
            {/* Quadrant Backgrounds */}
            {/* Top Left: Technical Debt (Low Churn, High Complexity) */}
            <rect x="40" y="20" width="260" height="140" fill="rgba(244, 169, 0, 0.05)" />
            <text x="50" y="38" fill="#f4a900" fontSize="11" fontWeight="700">TECHNICAL DEBT</text>

            {/* Top Right: Danger Zone (High Churn, High Complexity) */}
            <rect x="300" y="20" width="260" height="140" fill="rgba(220, 53, 69, 0.06)" />
            <text x="430" y="38" fill="#dc3545" fontSize="11" fontWeight="700">🔴 DANGER ZONE</text>

            {/* Bottom Left: Stable (Low Churn, Low Complexity) */}
            <rect x="40" y="160" width="260" height="140" fill="rgba(40, 167, 69, 0.05)" />
            <text x="50" y="290" fill="#28a745" fontSize="11" fontWeight="700">🟢 STABLE</text>

            {/* Bottom Right: Active Work (High Churn, Low Complexity) */}
            <rect x="300" y="160" width="260" height="140" fill="rgba(3, 102, 214, 0.05)" />
            <text x="450" y="290" fill="#0366d6" fontSize="11" fontWeight="700">🔵 ACTIVE WORK</text>

            {/* Axes */}
            <line x1="40" y1="160" x2="560" y2="160" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="300" y1="20" x2="300" y2="300" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 4" />

            {/* Outer Boundary */}
            <rect x="40" y="20" width="520" height="280" fill="none" stroke="var(--border)" strokeWidth="1.5" />

            {/* Axis Labels */}
            <text x="300" y="325" fill="var(--text-secondary)" fontSize="12" textAnchor="middle" fontWeight="600">
              MODIFICATION CHURN →
            </text>
            <text
              x="-160"
              y="20"
              fill="var(--text-secondary)"
              fontSize="12"
              textAnchor="middle"
              transform="rotate(-90)"
              fontWeight="600"
            >
              COMPLEXITY →
            </text>

            {/* Plot File Points */}
            {(data.scatterPlot || []).map((file, idx) => {
              // Map 0..100 to SVG coords:
              // X: 40 + (churn / 100) * 520
              // Y: 300 - (complexity / 100) * 280
              const cx = 40 + (file.churn / 100) * 520;
              const cy = 300 - (file.complexity / 100) * 280;
              const isHovered = hoveredFile?.path === file.path;

              const dotColor =
                file.quadrant === "danger"
                  ? "#dc3545"
                  : file.quadrant === "debt"
                  ? "#f4a900"
                  : file.quadrant === "active"
                  ? "#0366d6"
                  : "#28a745";

              return (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 8 : Math.max(4, Math.min(9, Math.sqrt(file.loc || 50)))}
                  fill={dotColor}
                  stroke={isHovered ? "#ffffff" : "transparent"}
                  strokeWidth={2}
                  opacity={isHovered ? 1 : 0.75}
                  style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                  onMouseEnter={() => setHoveredFile(file)}
                  onMouseLeave={() => setHoveredFile(null)}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Directory LOC & Complexity Breakdown */}
      {data.directoryBreakdown?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 className="card-title" style={{ marginBottom: 14 }}>
            📂 Top Module Distribution & Volume
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.directoryBreakdown.map((item) => (
              <div key={item.directory}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    📁 {item.directory}/
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {formatNumber(item.loc)} LOC ({item.percentage}%)
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: "var(--primary)"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Refactoring Candidates Table */}
      <div className="card" style={{ marginBottom: 24, padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              🛠️ Prioritized Refactoring Candidates
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
              Ranked by combined Risk Index (Complexity × Churn).
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All" },
              { id: "danger", label: "🔴 Danger" },
              { id: "debt", label: "🟡 Debt" },
              { id: "active", label: "🔵 Active" }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterQuadrant(f.id)}
                style={{
                  padding: "4px 10px", borderRadius: 14, fontSize: 12,
                  border: filterQuadrant === f.id ? "1px solid var(--primary)" : "1px solid var(--border)",
                  background: filterQuadrant === f.id ? "var(--primary)" : "var(--bg-tertiary)",
                  color: filterQuadrant === f.id ? "#ffffff" : "var(--text-secondary)",
                  cursor: "pointer", fontWeight: 600
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container" style={{ border: "none" }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: "35%" }}>File Path</th>
                <th>Classification</th>
                <th style={{ textAlign: "center" }}>Complexity</th>
                <th style={{ textAlign: "center" }}>Churn</th>
                <th style={{ textAlign: "center" }}>Risk Score</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((file) => {
                const badgeColor =
                  file.quadrant === "danger"
                    ? "badge-danger"
                    : file.quadrant === "debt"
                    ? "badge-warning"
                    : file.quadrant === "active"
                    ? "badge-info"
                    : "badge-success";

                return (
                  <tr key={file.path}>
                    <td style={{ fontWeight: 600, wordBreak: "break-word" }}>
                      <a
                        href={`https://github.com/${owner}/${repo}/blob/${data.defaultBranch}/${file.path}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--primary)", textDecoration: "none" }}
                      >
                        {file.path}
                      </a>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {formatNumber(file.estimatedLOC)} LOC
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${badgeColor}`} style={{ fontSize: 11 }}>
                        {file.quadrantLabel}
                      </span>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: file.complexityScore >= 70 ? "#dc3545" : "inherit" }}>
                        {file.complexityScore}
                      </span>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: file.churnScore >= 70 ? "#0366d6" : "inherit" }}>
                        {file.churnScore}
                      </span>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: 10,
                        backgroundColor: file.riskIndex >= 70 ? "rgba(220, 53, 69, 0.15)" : "var(--bg-tertiary)",
                        color: file.riskIndex >= 70 ? "#dc3545" : "var(--text-primary)",
                        fontWeight: 700, fontSize: 12
                      }}>
                        {file.riskIndex}
                      </span>
                    </td>

                    <td style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      {file.recommendation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Complexity;
