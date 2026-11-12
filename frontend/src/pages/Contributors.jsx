import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getContributors } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import { formatNumber } from "../utils/helpers";

function Contributors() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getContributors(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Analyzing community contributions, bus factor & maintainer risk..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  if (!data.dataAvailable) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">👥 Contributor Intelligence</h1>
          <p className="page-subtitle">{owner}/{repo}</p>
        </div>
        <RepoNav />
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <h3 style={{ marginBottom: "12px" }}>GitHub is calculating statistics</h3>
          <p style={{ color: "#586069", marginBottom: "24px" }}>
            GitHub needs a moment to compute contributor statistics for this repository.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            🔄 Refresh
          </button>
        </div>
      </div>
    );
  }

  const busFactor = data.busFactor || {
    busFactor: 0,
    riskLevel: "Unknown",
    riskColor: "#6c757d",
    sharePercentage: 0,
    keyMaintainers: [],
    description: "No data available"
  };

  const seg = data.segmentation || { coreCount: 0, regularCount: 0, casualCount: 0, segments: {} };
  const resilience = data.resilience || { score: 50, status: "Moderate" };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👥 Contributor Intelligence & Bus Factor</h1>
        <p className="page-subtitle">
          {owner}/{repo} — Core maintainer concentration, community resilience & Gini inequality index
        </p>
      </div>

      <RepoNav />

      {/* Top 4 Stat Cards */}
      <div className="grid-4" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">🚌</div>
          <div className="stat-value" style={{ color: busFactor.riskColor }}>
            {busFactor.busFactor} {busFactor.busFactor === 1 ? "Maintainer" : "Maintainers"}
          </div>
          <div className="stat-label">Bus Factor Score</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value" style={{ color: "#0366d6" }}>
            {formatNumber(data.totalContributors)}
          </div>
          <div className="stat-label">Total Contributors</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <div className="stat-value" style={{ color: data.giniIndex > 0.8 ? "#dc3545" : "#28a745" }}>
            {data.giniIndex}
          </div>
          <div className="stat-label">Gini Inequality Index</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-value" style={{ color: resilience.score >= 70 ? "#28a745" : resilience.score >= 45 ? "#f4a900" : "#dc3545" }}>
            {resilience.score}%
          </div>
          <div className="stat-label">Community Resilience</div>
        </div>
      </div>

      {/* Bus Factor Assessment Banner */}
      <div
        className="card"
        style={{
          marginBottom: "24px",
          padding: "20px 24px",
          background: `linear-gradient(135deg, ${busFactor.riskColor}15 0%, ${busFactor.riskColor}05 100%)`,
          borderLeft: `4px solid ${busFactor.riskColor}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div style={{ flex: 1, minWidth: "260px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span
              className="badge"
              style={{
                backgroundColor: busFactor.riskColor,
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "12px",
                textTransform: "uppercase"
              }}
            >
              {busFactor.riskLevel}
            </span>
            <span style={{ fontSize: "13px", color: "#586069", fontWeight: "600" }}>
              Bus Factor = {busFactor.busFactor}
            </span>
          </div>

          <h3 style={{ margin: "0 0 6px", fontSize: "17px", color: "#24292e" }}>
            {busFactor.description}
          </h3>

          {busFactor.keyMaintainers?.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "#586069", fontWeight: "600" }}>Key maintainers:</span>
              {busFactor.keyMaintainers.map((m) => (
                <Link
                  key={m}
                  to={`/user/${m}`}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "14px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #ced4da",
                    fontSize: "12px",
                    color: "#0366d6",
                    fontWeight: "600",
                    textDecoration: "none"
                  }}
                >
                  @{m} ↗
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right", background: "#ffffff", padding: "14px 20px", borderRadius: "10px", border: "1px solid #e1e4e8" }}>
          <div style={{ fontSize: "11px", color: "#586069", fontWeight: "700" }}>GOVERNANCE STATUS</div>
          <div style={{ fontSize: "16px", fontWeight: "800", color: "#24292e", marginTop: "2px" }}>
            {resilience.status}
          </div>
          <div style={{ fontSize: "12px", color: "#586069", marginTop: "2px" }}>
            {formatNumber(data.totalContributions)} total commits analyzed
          </div>
        </div>
      </div>

      {/* Contributor Segmentation (Pareto Distribution) */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 className="card-title" style={{ marginBottom: "16px" }}>
          📊 Community Structure & Contributor Segmentation
        </h3>

        {/* Pareto segmented bar */}
        <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden", backgroundColor: "#e1e4e8", marginBottom: "16px" }}>
          <div
            style={{ width: `${Math.max(5, (seg.coreCount / Math.max(1, data.totalContributors)) * 100)}%`, backgroundColor: "#0366d6" }}
            title={`Core: ${seg.coreCount} maintainers`}
          />
          <div
            style={{ width: `${Math.max(5, (seg.regularCount / Math.max(1, data.totalContributors)) * 100)}%`, backgroundColor: "#28a745" }}
            title={`Regular: ${seg.regularCount} contributors`}
          />
          <div
            style={{ width: `${Math.max(5, (seg.casualCount / Math.max(1, data.totalContributors)) * 100)}%`, backgroundColor: "#6f42c1" }}
            title={`Casual: ${seg.casualCount} contributors`}
          />
        </div>

        <div className="grid-3">
          <div style={{ padding: "14px", borderRadius: "8px", background: "#f8f9fa", borderLeft: "4px solid #0366d6" }}>
            <div style={{ fontSize: "11px", color: "#586069", fontWeight: "700" }}>CORE MAINTAINERS (Top 70% code)</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#0366d6", margin: "4px 0" }}>
              {seg.coreCount}
            </div>
            <div style={{ fontSize: "12px", color: "#586069" }}>
              Core engine of the repository responsible for majority of changes.
            </div>
          </div>

          <div style={{ padding: "14px", borderRadius: "8px", background: "#f8f9fa", borderLeft: "4px solid #28a745" }}>
            <div style={{ fontSize: "11px", color: "#586069", fontWeight: "700" }}>REGULAR CONTRIBUTORS (Next 25%)</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#28a745", margin: "4px 0" }}>
              {seg.regularCount}
            </div>
            <div style={{ fontSize: "12px", color: "#586069" }}>
              Frequent collaborators who build features and review improvements.
            </div>
          </div>

          <div style={{ padding: "14px", borderRadius: "8px", background: "#f8f9fa", borderLeft: "4px solid #6f42c1" }}>
            <div style={{ fontSize: "11px", color: "#586069", fontWeight: "700" }}>CASUAL CONTRIBUTORS (Remaining 5%)</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#6f42c1", margin: "4px 0" }}>
              {seg.casualCount}
            </div>
            <div style={{ fontSize: "12px", color: "#586069" }}>
              Drive-by community fixers, documentation contributors, and issue patchers.
            </div>
          </div>
        </div>
      </div>

      {/* Contributor Directory Table */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: "16px" }}>
          🏆 Contributor Directory ({data.contributors.length})
        </h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>Rank</th>
                <th>Contributor</th>
                <th style={{ width: "120px" }}>Tier</th>
                <th style={{ width: "130px" }}>Commits</th>
                <th style={{ width: "100px" }}>Share</th>
                <th style={{ width: "180px" }}>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {data.contributors.slice(0, 30).map((c) => {
                const roleColor = c.role === "Core" ? "#0366d6" : c.role === "Regular" ? "#28a745" : "#6f42c1";
                return (
                  <tr key={c.login}>
                    <td style={{ color: "#586069", fontWeight: "600" }}>#{c.rank}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Link to={`/user/${c.login}`} title={`Analyze ${c.login}`}>
                          <img
                            src={c.avatar}
                            alt={c.login}
                            style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #e1e4e8" }}
                          />
                        </Link>
                        <div>
                          <Link to={`/user/${c.login}`} style={{ color: "#0366d6", fontWeight: "600", textDecoration: "none" }}>
                            {c.login}
                          </Link>
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            title="Open on GitHub"
                            style={{ color: "#959da5", fontSize: "11px", textDecoration: "none", marginLeft: "6px" }}
                          >
                            ↗
                          </a>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: `${roleColor}15`,
                          color: roleColor,
                          fontWeight: "700",
                          fontSize: "11px"
                        }}
                      >
                        {c.role}
                      </span>
                    </td>
                    <td><strong>{formatNumber(c.contributions)}</strong></td>
                    <td style={{ color: "#586069", fontWeight: "600" }}>
                      {c.share}%
                    </td>
                    <td>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${c.share}%`,
                            backgroundColor: roleColor
                          }}
                        />
                      </div>
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

export default Contributors;
