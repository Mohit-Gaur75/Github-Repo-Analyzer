import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getReleases } from "../api/apiService";
import { timeAgo, formatNumber } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";

function Releases() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getReleases(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Analyzing repository releases, cadence & semver patterns..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  const latest = data.latestRelease;
  const semver = data.semverStats || {};
  const totalSemver = (semver.major || 0) + (semver.minor || 0) + (semver.patch || 0) + (semver.prerelease || 0) || 1;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏷️ Releases & Versioning Cadence</h1>
        <p className="page-subtitle">
          {owner}/{repo} — Shipping frequency, semantic versioning analysis & release timeline
        </p>
      </div>

      <RepoNav />

      {/* Top Stat Cards */}
      <div className="grid-4" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-value" style={{ color: "#0366d6" }}>
            {latest ? latest.tag : "None"}
          </div>
          <div className="stat-label">Latest Release</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value" style={{ fontSize: "20px", color: data.cadence.color }}>
            {data.cadence.avgDaysBetweenReleases ? `~${data.cadence.avgDaysBetweenReleases} days` : "—"}
          </div>
          <div className="stat-label">Average Release Interval</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value" style={{ color: "#28a745" }}>
            {data.totalReleases}
          </div>
          <div className="stat-label">Releases ({data.totalTags} tags)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⬇️</div>
          <div className="stat-value" style={{ color: "#6f42c1" }}>
            {formatNumber(data.releases.reduce((sum, r) => sum + r.downloadCount, 0))}
          </div>
          <div className="stat-label">Total Asset Downloads</div>
        </div>
      </div>

      {/* Shipping Cadence Status Banner */}
      <div
        className="card"
        style={{
          marginBottom: "24px",
          padding: "18px 24px",
          background: `linear-gradient(135deg, ${data.cadence.color}15 0%, ${data.cadence.color}05 100%)`,
          borderLeft: `4px solid ${data.cadence.color}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div>
          <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: data.cadence.color, marginBottom: "4px" }}>
            Shipping Velocity
          </div>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#24292e" }}>
            {data.cadence.status}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#586069" }}>
            Based on historical intervals between published GitHub releases.
          </p>
        </div>

        {latest?.publishedAt && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#586069", fontWeight: "600" }}>LAST SHIPPED</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#24292e" }}>
              {timeAgo(latest.publishedAt)}
            </div>
          </div>
        )}
      </div>

      {/* Latest Release Spotlight */}
      {latest && (
        <div className="card" style={{ marginBottom: "24px", borderTop: "4px solid #0366d6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span className="badge badge-info" style={{ fontSize: "14px", fontWeight: "700" }}>
                  {latest.tag}
                </span>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
                  {latest.name}
                </h3>
                {latest.isPrerelease && <span className="badge badge-warning">Pre-release</span>}
              </div>
              <div style={{ fontSize: "13px", color: "#586069", marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                {latest.author?.avatar && (
                  <img
                    src={latest.author.avatar}
                    alt={latest.author.login}
                    style={{ width: "20px", height: "20px", borderRadius: "50%" }}
                  />
                )}
                <span>Released by <strong>{latest.author?.login}</strong></span>
                {latest.publishedAt && <span>· {timeAgo(latest.publishedAt)}</span>}
              </div>
            </div>

            <a
              href={latest.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm"
              style={{ fontWeight: "600" }}
            >
              View on GitHub ↗
            </a>
          </div>

          {latest.body ? (
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e1e4e8",
                fontSize: "13px",
                color: "#333",
                lineHeight: "1.6",
                maxHeight: "240px",
                overflowY: "auto",
                fontFamily: "monospace"
              }}
            >
              {latest.body}
            </div>
          ) : (
            <p style={{ color: "#586069", fontSize: "13px", fontStyle: "italic" }}>
              No release notes provided for this tag.
            </p>
          )}
        </div>
      )}

      {/* Semantic Versioning Breakdown */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 className="card-title" style={{ marginBottom: "16px" }}>
          🔢 Semantic Versioning Breakdown
        </h3>

        {/* Distribution Bar */}
        <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden", backgroundColor: "#e1e4e8", marginBottom: "16px" }}>
          <div style={{ width: `${((semver.major || 0) / totalSemver) * 100}%`, backgroundColor: "#dc3545" }} title={`Major: ${semver.major}`} />
          <div style={{ width: `${((semver.minor || 0) / totalSemver) * 100}%`, backgroundColor: "#0366d6" }} title={`Minor: ${semver.minor}`} />
          <div style={{ width: `${((semver.patch || 0) / totalSemver) * 100}%`, backgroundColor: "#28a745" }} title={`Patch: ${semver.patch}`} />
          <div style={{ width: `${((semver.prerelease || 0) / totalSemver) * 100}%`, backgroundColor: "#f4a900" }} title={`Pre-release: ${semver.prerelease}`} />
        </div>

        <div className="grid-4">
          <div style={{ padding: "12px", borderRadius: "8px", background: "#f8f9fa", borderLeft: "3px solid #dc3545" }}>
            <div style={{ fontSize: "11px", color: "#586069", fontWeight: "700" }}>MAJOR RELEASES</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#dc3545", margin: "2px 0" }}>
              {semver.major || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#586069" }}>Breaking changes & overhauls</div>
          </div>

          <div style={{ padding: "12px", borderRadius: "8px", background: "#f8f9fa", borderLeft: "3px solid #0366d6" }}>
            <div style={{ fontSize: "11px", color: "#586069", fontWeight: "700" }}>MINOR RELEASES</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#0366d6", margin: "2px 0" }}>
              {semver.minor || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#586069" }}>New features & capabilities</div>
          </div>

          <div style={{ padding: "12px", borderRadius: "8px", background: "#f8f9fa", borderLeft: "3px solid #28a745" }}>
            <div style={{ fontSize: "11px", color: "#586069", fontWeight: "700" }}>PATCH RELEASES</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#28a745", margin: "2px 0" }}>
              {semver.patch || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#586069" }}>Bug fixes & stability tweaks</div>
          </div>

          <div style={{ padding: "12px", borderRadius: "8px", background: "#f8f9fa", borderLeft: "3px solid #f4a900" }}>
            <div style={{ fontSize: "11px", color: "#586069", fontWeight: "700" }}>PRE-RELEASES</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#f4a900", margin: "2px 0" }}>
              {semver.prerelease || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#586069" }}>Alpha, beta, and RC builds</div>
          </div>
        </div>
      </div>

      {/* Releases History Timeline */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: "16px" }}>
          📜 Release History ({data.releases.length})
        </h3>

        {data.releases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#586069" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>📦</div>
            <p>No tagged releases found on GitHub for this repository.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.releases.map((rel) => (
              <div
                key={rel.id || rel.tag}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "14px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e1e4e8",
                  backgroundColor: "#ffffff"
                }}
              >
                <span className="badge badge-info" style={{ fontWeight: "700", marginTop: "2px" }}>
                  {rel.tag}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#24292e" }}>
                      {rel.name}
                    </h4>
                    <span style={{ fontSize: "12px", color: "#959da5" }}>
                      {rel.publishedAt ? timeAgo(rel.publishedAt) : "No date"}
                    </span>
                  </div>

                  {rel.body && (
                    <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#586069", lineHeight: "1.4" }}>
                      {rel.body.slice(0, 160)}{rel.body.length > 160 ? "..." : ""}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "11px", color: "#586069" }}>
                    {rel.author?.login && <span>👤 {rel.author.login}</span>}
                    {rel.assetsCount > 0 && <span>📎 {rel.assetsCount} assets</span>}
                    {rel.downloadCount > 0 && <span>⬇️ {formatNumber(rel.downloadCount)} downloads</span>}
                    <a
                      href={rel.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#0366d6", textDecoration: "none", marginLeft: "auto", fontWeight: "600" }}
                    >
                      Release Notes ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Releases;
