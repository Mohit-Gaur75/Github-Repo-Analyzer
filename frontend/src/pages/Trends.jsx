import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRepoTrend } from "../api/apiService";
import { formatNumber } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";

function Trends() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getRepoTrend(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Calculating repository growth velocity & trajectory..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  // Timeline SVG calculations
  const timeline = data.timeline || [];
  const maxStars = Math.max(...timeline.map((p) => p.stars), 1);
  const svgWidth = 720;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 30;

  const points = timeline.map((p, idx) => {
    const x = paddingX + (idx / (timeline.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - (p.stars / maxStars) * (svgHeight - paddingY * 2);
    return { ...p, x, y };
  });

  const actualPoints = points.filter((p) => p.type === "actual");
  const projectedPoints = points.filter((p) => p.type === "projected");

  // SVG Paths
  const actualPath = actualPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const projectedPath = [
    actualPoints[actualPoints.length - 1],
    ...projectedPoints
  ].map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const nextMilestone = data.milestones?.[0] || null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📈 Star Growth & Trajectory Prediction</h1>
        <p className="page-subtitle">
          {owner}/{repo} — Velocity metrics, predictive milestones & future star forecasts
        </p>
      </div>

      <RepoNav />

      {/* Top Stat Cards */}
      <div className="grid-4" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-value" style={{ color: "#0366d6" }}>
            +{data.velocity.daily}
          </div>
          <div className="stat-label">Daily Star Velocity</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🧭</div>
          <div className="stat-value" style={{ fontSize: "20px", color: data.trajectory.color }}>
            {data.trajectory.status.split(" ")[0]} {data.trajectory.status.split(" ").slice(1).join(" ")}
          </div>
          <div className="stat-label">Growth Trajectory</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔮</div>
          <div className="stat-value" style={{ color: "#6f42c1" }}>
            {formatNumber(data.projections.in1Year)}
          </div>
          <div className="stat-label">1-Year Forecast (Stars)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value" style={{ color: "#28a745" }}>
            {nextMilestone ? `${nextMilestone.daysToTarget || "—"}d` : "🏆 Reached"}
          </div>
          <div className="stat-label">
            {nextMilestone ? `Days to ${formatNumber(nextMilestone.target)}★` : "Top Tier"}
          </div>
        </div>
      </div>

      {/* Trajectory Status Banner */}
      <div
        className="card"
        style={{
          marginBottom: "24px",
          padding: "18px 24px",
          background: `linear-gradient(135deg, ${data.trajectory.color}15 0%, ${data.trajectory.color}05 100%)`,
          borderLeft: `4px solid ${data.trajectory.color}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: data.trajectory.color, marginBottom: "4px" }}>
            Pace Classification
          </div>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#24292e" }}>
            {data.trajectory.status}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#586069" }}>
            {data.trajectory.description}
          </p>
        </div>

        <div style={{ display: "flex", gap: "16px", textAlign: "right" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#586069", fontWeight: "600" }}>WEEKLY VELOCITY</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#0366d6" }}>
              +{data.velocity.weekly}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#586069", fontWeight: "600" }}>MONTHLY RUN-RATE</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#6f42c1" }}>
              +{formatNumber(data.velocity.monthly)}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Growth & Projection Chart */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            📊 Star Growth Trajectory & Future Projection
          </h3>
          <div style={{ display: "flex", gap: "14px", fontSize: "12px", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-block", width: "12px", height: "3px", backgroundColor: "#0366d6" }} />
              Historical Growth
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-block", width: "12px", height: "3px", borderTop: "2px dashed #6f42c1" }} />
              Projected (12 Months)
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: "100%", minWidth: "600px", height: "auto" }}
          >
            {/* Background horizontal grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const y = svgHeight - paddingY - ratio * (svgHeight - paddingY * 2);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#e1e4e8"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 6}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#959da5"
                  >
                    {formatNumber(Math.round(maxStars * ratio))}
                  </text>
                </g>
              );
            })}

            {/* Actual curve (solid) */}
            <path
              d={actualPath}
              fill="none"
              stroke="#0366d6"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Projected curve (dashed) */}
            <path
              d={projectedPath}
              fill="none"
              stroke="#6f42c1"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />

            {/* Data points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.type === "actual" ? "4.5" : "4"}
                  fill={p.type === "actual" ? "#0366d6" : "#ffffff"}
                  stroke={p.type === "actual" ? "#ffffff" : "#6f42c1"}
                  strokeWidth="2"
                />
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={p.type === "actual" ? "#0366d6" : "#6f42c1"}
                >
                  {formatNumber(p.stars)}
                </text>
                <text
                  x={p.x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#959da5"
                >
                  {p.date.slice(2)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Projections in 30 / 90 / 180 / 365 Days */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 className="card-title" style={{ marginBottom: "16px" }}>
          🔮 Projected Star Forecasts
        </h3>
        <div className="grid-4">
          <div style={{ padding: "14px", borderRadius: "8px", background: "#f8f9fa", border: "1px solid #e1e4e8" }}>
            <div style={{ fontSize: "12px", color: "#586069", fontWeight: "600" }}>IN 30 DAYS</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#0366d6", margin: "4px 0" }}>
              {formatNumber(data.projections.in30Days)}
            </div>
            <div style={{ fontSize: "12px", color: "#28a745" }}>
              +{formatNumber(Math.round(data.velocity.daily * 30))} stars
            </div>
          </div>

          <div style={{ padding: "14px", borderRadius: "8px", background: "#f8f9fa", border: "1px solid #e1e4e8" }}>
            <div style={{ fontSize: "12px", color: "#586069", fontWeight: "600" }}>IN 90 DAYS (3 MO)</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#0366d6", margin: "4px 0" }}>
              {formatNumber(data.projections.in90Days)}
            </div>
            <div style={{ fontSize: "12px", color: "#28a745" }}>
              +{formatNumber(Math.round(data.velocity.daily * 90))} stars
            </div>
          </div>

          <div style={{ padding: "14px", borderRadius: "8px", background: "#f8f9fa", border: "1px solid #e1e4e8" }}>
            <div style={{ fontSize: "12px", color: "#586069", fontWeight: "600" }}>IN 180 DAYS (6 MO)</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#6f42c1", margin: "4px 0" }}>
              {formatNumber(data.projections.in180Days)}
            </div>
            <div style={{ fontSize: "12px", color: "#28a745" }}>
              +{formatNumber(Math.round(data.velocity.daily * 180))} stars
            </div>
          </div>

          <div style={{ padding: "14px", borderRadius: "8px", background: "#f8f9fa", border: "1px solid #e1e4e8" }}>
            <div style={{ fontSize: "12px", color: "#586069", fontWeight: "600" }}>IN 1 YEAR (12 MO)</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#6f42c1", margin: "4px 0" }}>
              {formatNumber(data.projections.in1Year)}
            </div>
            <div style={{ fontSize: "12px", color: "#28a745" }}>
              +{formatNumber(Math.round(data.velocity.daily * 365))} stars
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Forecasts Table */}
      {data.milestones.length > 0 && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <h3 className="card-title" style={{ marginBottom: "16px" }}>
            🎯 Star Milestones Forecast
          </h3>
          <div className="table-container" style={{ border: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Milestone Target</th>
                  <th>Progress</th>
                  <th>Stars Remaining</th>
                  <th>Est. Days to Reach</th>
                  <th>Target Date</th>
                </tr>
              </thead>
              <tbody>
                {data.milestones.map((m) => (
                  <tr key={m.target}>
                    <td>
                      <strong style={{ fontSize: "14px", color: "#24292e" }}>
                        ⭐ {formatNumber(m.target)} Stars
                      </strong>
                    </td>
                    <td style={{ width: "220px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div
                            className="progress-fill"
                            style={{ width: `${m.progressPercent}%`, backgroundColor: "#28a745" }}
                          />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "600", width: "40px" }}>
                          {m.progressPercent}%
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "#586069" }}>
                      {formatNumber(m.starsRemaining)}
                    </td>
                    <td>
                      <strong>{m.daysToTarget ? `~${m.daysToTarget} days` : "—"}</strong>
                    </td>
                    <td style={{ color: "#0366d6", fontWeight: "600" }}>
                      {m.estimatedDate || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lifetime & Maintenance Telemetry */}
      <div className="grid-3">
        <div className="card">
          <h4 style={{ fontSize: "14px", color: "#586069", marginBottom: "8px" }}>⏳ REPOSITORY AGE</h4>
          <div style={{ fontSize: "20px", fontWeight: "700" }}>
            {data.ageInYears} years ({formatNumber(data.ageInDays)} days)
          </div>
          <div style={{ fontSize: "12px", color: "#959da5", marginTop: "4px" }}>
            Lifetime average: {data.velocity.lifetimeDaily} stars/day
          </div>
        </div>

        <div className="card">
          <h4 style={{ fontSize: "14px", color: "#586069", marginBottom: "8px" }}>📦 ANNUAL COMMITS</h4>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#0366d6" }}>
            {formatNumber(data.commitsLast52Weeks)} commits
          </div>
          <div style={{ fontSize: "12px", color: "#959da5", marginTop: "4px" }}>
            Last push: {data.daysSinceLastPush === 0 ? "Today" : `${data.daysSinceLastPush} days ago`}
          </div>
        </div>

        <div className="card">
          <h4 style={{ fontSize: "14px", color: "#586069", marginBottom: "8px" }}>🍴 COMMUNITY FORKS</h4>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#6f42c1" }}>
            {formatNumber(data.forks)} forks
          </div>
          <div style={{ fontSize: "12px", color: "#959da5", marginTop: "4px" }}>
            Ratio: {data.stars > 0 ? (data.forks / data.stars).toFixed(2) : "0"} forks/star
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trends;
