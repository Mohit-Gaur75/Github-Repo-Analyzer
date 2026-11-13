import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getCommits } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import { useTheme } from "../context/themeContext";
import { formatNumber, timeAgo } from "../utils/helpers";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Commits() {
  const { owner, repo } = useParams();
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [viewRange, setViewRange] = useState("all"); // "all", "6m", "3m"
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredPunch, setHoveredPunch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    getCommits(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [owner, repo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isDark = theme === "dark";

  // Color palette for 52-week heatmap levels
  const heatmapColors = useMemo(() => {
    if (isDark) {
      return ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
    }
    return ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
  }, [isDark]);

  // Filtered weeks for Heatmap
  const displayedWeeks = useMemo(() => {
    const allWeeks = data?.calendar?.weeks || [];
    if (viewRange === "3m") return allWeeks.slice(-13);
    if (viewRange === "6m") return allWeeks.slice(-26);
    return allWeeks;
  }, [data?.calendar?.weeks, viewRange]);

  // Recalculate month labels based on displayed weeks
  const displayedMonthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    displayedWeeks.forEach((w, idx) => {
      if (w.days && w.days.length > 0) {
        const m = new Date(w.days[0].date).getUTCMonth();
        if (m !== lastMonth) {
          labels.push({
            month: monthNames[m],
            weekIndex: idx
          });
          lastMonth = m;
        }
      }
    });
    return labels;
  }, [displayedWeeks]);

  // Filtered recent commits
  const filteredRecentCommits = useMemo(() => {
    const list = data?.recentCommits || [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (c) =>
        c.message?.toLowerCase().includes(q) ||
        c.author?.toLowerCase().includes(q) ||
        c.sha?.toLowerCase().includes(q)
    );
  }, [data?.recentCommits, searchTerm]);

  if (loading) return <LoadingSpinner message="Calculating commit activity, calendar heatmap & punchcard matrix..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

  if (!data.dataAvailable) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">📝 Commits</h1>
          <p className="page-subtitle">{owner}/{repo}</p>
        </div>
        <RepoNav />
        <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <h3 style={{ marginBottom: "12px" }}>GitHub is compiling statistics</h3>
          <p style={{ color: "var(--text-secondary, #586069)", marginBottom: "24px", maxWidth: "500px", margin: "0 auto 24px" }}>
            GitHub calculates commit activity and punchcard stats asynchronously for this repository.
            Please wait a moment and refresh.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            {refreshing ? "🔄 Refreshing..." : "🔄 Refresh Stats"}
          </button>
        </div>
      </div>
    );
  }

  const calendar = data.calendar || { streaks: {}, weeks: [] };
  const punchCard = data.punchCard || { cadence: {}, dayTotals: [], hourTotals: [], timeBlocks: [] };
  const cadence = punchCard.cadence || {};

  // Heatmap SVG Geometry
  const cellWidth = 11;
  const cellHeight = 11;
  const cellGap = 3;
  const labelOffsetX = 30;
  const labelOffsetY = 20;
  const totalWeeks = displayedWeeks.length;
  const heatmapSvgWidth = Math.max(760, labelOffsetX + totalWeeks * (cellWidth + cellGap) + 16);
  const heatmapSvgHeight = labelOffsetY + 7 * (cellHeight + cellGap) + 8;

  // Punchcard SVG Geometry
  const punchCellSize = 28;
  const punchLabelOffsetX = 45;
  const punchLabelOffsetY = 24;
  const punchSvgWidth = punchLabelOffsetX + 24 * punchCellSize + 16;
  const punchSvgHeight = punchLabelOffsetY + 7 * punchCellSize + 12;
  const maxPunchVal = punchCard.maxHourCommits || 1;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title">📝 Commits & Engineering Cadence</h1>
          <p className="page-subtitle">
            <Link to={`/dashboard/${owner}/${repo}`} style={{ color: "inherit", textDecoration: "underline" }}>
              {owner}/{repo}
            </Link>{" "}
            — 52-week calendar heatmap, 24×7 punchcard matrix &amp; streak analysis
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{ fontSize: "13px" }}
          >
            {refreshing ? "🔄 Refreshing..." : "🔄 Refresh"}
          </button>
          <a
            href={`https://github.com/${owner}/${repo}/commits`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
            style={{ fontSize: "13px" }}
          >
            🔗 GitHub Commits
          </a>
        </div>
      </div>

      <RepoNav />

      {/* KPI Stat Cards */}
      <div className="grid-4" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{formatNumber(data.totalCommitsLastYear || calendar.totalCommitsLastYear || 0)}</div>
          <div className="stat-label">Commits (Past Year)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value" style={{ color: "#d97706" }}>
            {calendar.streaks?.currentStreak || 0} <span style={{ fontSize: "14px", fontWeight: "normal" }}>days</span>
          </div>
          <div className="stat-label">Current Active Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-value" style={{ color: "#059669" }}>
            {calendar.streaks?.longestStreak || 0} <span style={{ fontSize: "14px", fontWeight: "normal" }}>days</span>
          </div>
          <div className="stat-label">Longest Active Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">
            {calendar.streaks?.totalActiveDays || data.activeDays || 0}
            <span style={{ fontSize: "13px", fontWeight: "normal", color: "var(--text-secondary, #666)", marginLeft: "4px" }}>
              / 365
            </span>
          </div>
          <div className="stat-label">Active Coding Days</div>
        </div>
      </div>

      {/* 52-Week Contribution Heatmap */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              📅 52-Week Commit Activity Heatmap
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary, #586069)" }}>
              Daily commit density across all branches over the last 365 days
            </p>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className={`btn ${viewRange === "all" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "4px 10px", fontSize: "12px" }}
              onClick={() => setViewRange("all")}
            >
              Full Year (52 Wks)
            </button>
            <button
              className={`btn ${viewRange === "6m" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "4px 10px", fontSize: "12px" }}
              onClick={() => setViewRange("6m")}
            >
              Last 6 Mos
            </button>
            <button
              className={`btn ${viewRange === "3m" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "4px 10px", fontSize: "12px" }}
              onClick={() => setViewRange("3m")}
            >
              Last 3 Mos
            </button>
          </div>
        </div>

        {/* SVG Heatmap */}
        <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
          <svg
            viewBox={`0 0 ${heatmapSvgWidth} ${heatmapSvgHeight}`}
            style={{ width: "100%", minWidth: `${heatmapSvgWidth}px`, display: "block" }}
          >
            {/* Month labels */}
            {displayedMonthLabels.map((ml, idx) => {
              const xPos = labelOffsetX + ml.weekIndex * (cellWidth + cellGap);
              return (
                <text
                  key={idx}
                  x={xPos}
                  y={labelOffsetY - 6}
                  fontSize="11"
                  fill="var(--text-secondary, #656d76)"
                  fontFamily="sans-serif"
                >
                  {ml.month}
                </text>
              );
            })}

            {/* Day of week labels (Mon, Wed, Fri) */}
            <text x="2" y={labelOffsetY + 1 * (cellHeight + cellGap) + 9} fontSize="10" fill="var(--text-secondary, #656d76)" fontFamily="sans-serif">
              Mon
            </text>
            <text x="2" y={labelOffsetY + 3 * (cellHeight + cellGap) + 9} fontSize="10" fill="var(--text-secondary, #656d76)" fontFamily="sans-serif">
              Wed
            </text>
            <text x="2" y={labelOffsetY + 5 * (cellHeight + cellGap) + 9} fontSize="10" fill="var(--text-secondary, #656d76)" fontFamily="sans-serif">
              Fri
            </text>

            {/* Grid of squares */}
            {displayedWeeks.map((week, wIdx) => {
              const colX = labelOffsetX + wIdx * (cellWidth + cellGap);
              return (
                <g key={wIdx}>
                  {(week.days || []).map((day, dIdx) => {
                    const rowY = labelOffsetY + dIdx * (cellHeight + cellGap);
                    const color = heatmapColors[day.level || 0];
                    const isHovered = hoveredDay?.date === day.date;

                    return (
                      <rect
                        key={dIdx}
                        x={colX}
                        y={rowY}
                        width={cellWidth}
                        height={cellHeight}
                        rx="2"
                        ry="2"
                        fill={color}
                        stroke={isHovered ? "var(--primary-color, #0969da)" : "none"}
                        strokeWidth={isHovered ? 1.5 : 0}
                        style={{ cursor: "pointer", transition: "transform 0.1s" }}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Heatmap Footer: Hover Info & Legend */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid var(--border-color, #e1e4e8)",
            fontSize: "12px",
            color: "var(--text-secondary, #586069)",
            flexWrap: "wrap",
            gap: "8px"
          }}
        >
          <div>
            {hoveredDay ? (
              <span>
                <strong>{hoveredDay.count} commits</strong> on {hoveredDay.dayName}, {hoveredDay.date}
              </span>
            ) : calendar.busiestDay ? (
              <span>
                🏆 Busiest day: <strong>{calendar.busiestDay.count} commits</strong> on {calendar.busiestDay.date} ({calendar.busiestDay.dayName})
              </span>
            ) : (
              <span>Hover over any square for daily details</span>
            )}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ marginRight: "4px" }}>Less</span>
            {heatmapColors.map((color, idx) => (
              <span
                key={idx}
                style={{
                  display: "inline-block",
                  width: "11px",
                  height: "11px",
                  borderRadius: "2px",
                  backgroundColor: color
                }}
              />
            ))}
            <span style={{ marginLeft: "4px" }}>More</span>
          </div>
        </div>
      </div>

      {/* 24x7 Day/Hour Punchcard Matrix */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              ⏱️ 24h × 7d Punchcard Matrix
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary, #586069)" }}>
              Bubble size represents commit frequency by day of week and hour of day (UTC)
            </p>
          </div>
          {punchCard.peakDay && punchCard.peakHour && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span className="badge badge-info" style={{ fontSize: "12px" }}>
                🌟 Peak Day: {punchCard.peakDay.day} ({punchCard.peakDay.commits} commits)
              </span>
              <span className="badge badge-success" style={{ fontSize: "12px" }}>
                ⏰ Peak Hour: {punchCard.peakHour.label} ({punchCard.peakHour.commits} commits)
              </span>
            </div>
          )}
        </div>

        {/* SVG Punchcard Matrix */}
        <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
          <svg
            viewBox={`0 0 ${punchSvgWidth} ${punchSvgHeight}`}
            style={{ width: "100%", minWidth: `${punchSvgWidth}px`, display: "block" }}
          >
            {/* Hour header labels (0 to 23) */}
            {Array.from({ length: 24 }, (_, hour) => {
              const xPos = punchLabelOffsetX + hour * punchCellSize + punchCellSize / 2;
              return (
                <text
                  key={hour}
                  x={xPos}
                  y={punchLabelOffsetY - 8}
                  fontSize="10"
                  textAnchor="middle"
                  fill="var(--text-secondary, #656d76)"
                  fontFamily="sans-serif"
                >
                  {hour % 3 === 0 ? (hour === 0 ? "12a" : hour === 12 ? "12p" : hour < 12 ? `${hour}a` : `${hour - 12}p`) : ""}
                </text>
              );
            })}

            {/* Day rows (Sun..Sat) */}
            {DAY_LABELS.map((dayLabel, dIdx) => {
              const rowY = punchLabelOffsetY + dIdx * punchCellSize + punchCellSize / 2;
              return (
                <g key={dIdx}>
                  {/* Day label */}
                  <text
                    x={punchLabelOffsetX - 10}
                    y={rowY + 4}
                    fontSize="11"
                    textAnchor="end"
                    fontWeight="500"
                    fill="var(--text-secondary, #656d76)"
                    fontFamily="sans-serif"
                  >
                    {dayLabel}
                  </text>

                  {/* 24 hour bubble slots */}
                  {Array.from({ length: 24 }, (_, hIdx) => {
                    const colX = punchLabelOffsetX + hIdx * punchCellSize + punchCellSize / 2;
                    const count = punchCard.matrix?.[dIdx]?.[hIdx] || 0;
                    const fraction = count / maxPunchVal;
                    // Radius scales between 2px (empty) and 11px (max)
                    const radius = count > 0 ? Math.max(3, Math.sqrt(fraction) * 11) : 2;
                    const opacity = count > 0 ? Math.max(0.4, fraction) : 0.15;
                    const fill = count > 0 ? (isDark ? "#58a6ff" : "#0969da") : "var(--text-secondary, #8b949e)";
                    const isHovered = hoveredPunch?.dayIndex === dIdx && hoveredPunch?.hour === hIdx;

                    return (
                      <g key={hIdx}>
                        {/* Hover bounding box */}
                        <rect
                          x={punchLabelOffsetX + hIdx * punchCellSize}
                          y={punchLabelOffsetY + dIdx * punchCellSize}
                          width={punchCellSize}
                          height={punchCellSize}
                          fill="transparent"
                          style={{ cursor: "pointer" }}
                          onMouseEnter={() =>
                            setHoveredPunch({
                              day: DAY_LABELS[dIdx],
                              dayIndex: dIdx,
                              hour: hIdx,
                              label: formatHour(hIdx),
                              count,
                              percentage:
                                punchCard.totalCommits > 0
                                  ? ((count / punchCard.totalCommits) * 100).toFixed(1)
                                  : 0
                            })
                          }
                          onMouseLeave={() => setHoveredPunch(null)}
                        />
                        {/* Bubble */}
                        <circle
                          cx={colX}
                          cy={rowY}
                          r={isHovered ? radius + 1.5 : radius}
                          fill={fill}
                          opacity={opacity}
                          stroke={isHovered ? "var(--text-primary, #ffffff)" : "none"}
                          strokeWidth={isHovered ? 1.5 : 0}
                          style={{ pointerEvents: "none", transition: "r 0.1s" }}
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Punchcard Footer Hover detail */}
        <div
          style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid var(--border-color, #e1e4e8)",
            fontSize: "12px",
            color: "var(--text-secondary, #586069)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px"
          }}
        >
          <div>
            {hoveredPunch ? (
              <span>
                <strong>{hoveredPunch.day} at {hoveredPunch.label}</strong>: {hoveredPunch.count} commits ({hoveredPunch.percentage}% of weekly commits)
              </span>
            ) : (
              <span>Hover over any bubble to see exact hourly commit density</span>
            )}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary, #656d76)" }}>
            Matrix totals: <strong>{formatNumber(punchCard.totalCommits || 0)}</strong> commits analyzed
          </div>
        </div>
      </div>

      {/* Cadence, Rhythm & Day/Time Breakdown */}
      <div className="grid-2" style={{ marginBottom: "24px" }}>
        {/* Engineering Cadence & Work Rhythm */}
        <div className="card">
          <h3 className="card-title">🏢 Engineering Cadence &amp; Work Rhythm</h3>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "15px", fontWeight: "600" }}>{cadence.classification || "Balanced Cadence"}</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary, #586069)", lineHeight: "1.5", margin: 0 }}>
              {cadence.description || "Consistent engineering activity distributed across the week."}
            </p>
          </div>

          {/* Weekday vs Weekend Comparison Bar */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
              <span>💼 Weekdays (Mon–Fri): <strong>{cadence.weekdayPct || 0}%</strong> ({formatNumber(cadence.weekdayCommits || 0)})</span>
              <span>🏖️ Weekends (Sat–Sun): <strong>{cadence.weekendPct || 0}%</strong> ({formatNumber(cadence.weekendCommits || 0)})</span>
            </div>
            <div style={{ height: "10px", borderRadius: "5px", overflow: "hidden", display: "flex", backgroundColor: "var(--border-color, #e1e4e8)" }}>
              <div
                style={{
                  width: `${cadence.weekdayPct || 50}%`,
                  backgroundColor: "#0969da",
                  transition: "width 0.3s"
                }}
                title={`Weekdays: ${cadence.weekdayPct}%`}
              />
              <div
                style={{
                  width: `${cadence.weekendPct || 50}%`,
                  backgroundColor: "#2da44e",
                  transition: "width 0.3s"
                }}
                title={`Weekends: ${cadence.weekendPct}%`}
              />
            </div>
          </div>

          {/* 4 Time-of-day blocks */}
          <h4 style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", color: "var(--text-secondary, #586069)" }}>
            Time of Day Distribution (UTC)
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {(punchCard.timeBlocks || []).map((block, idx) => {
              const isDominant = punchCard.dominantBlock?.name === block.name;
              return (
                <div
                  key={idx}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: `1px solid ${isDominant ? "var(--primary-color, #0969da)" : "var(--border-color, #e1e4e8)"}`,
                    backgroundColor: isDominant ? (isDark ? "rgba(56, 139, 253, 0.1)" : "rgba(9, 105, 218, 0.05)") : "var(--bg-secondary, #f6f8fa)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>{block.icon} {block.name?.split(" ")[0]}</span>
                    <strong>{block.percentage}%</strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary, #586069)", marginBottom: "6px" }}>
                    {formatNumber(block.commits)} commits
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", backgroundColor: "var(--border-color, #e1e4e8)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${block.percentage}%`,
                        height: "100%",
                        backgroundColor: isDominant ? "#0969da" : "var(--text-secondary, #8b949e)"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day of Week Commit Distribution */}
        <div className="card">
          <h3 className="card-title">📊 Day of Week Commit Distribution</h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary, #586069)", marginBottom: "16px" }}>
            Aggregated commit totals across all analyzed weeks
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(punchCard.dayTotals || []).map((day) => {
              const maxDayCommits = Math.max(...(punchCard.dayTotals || []).map((d) => d.commits), 1);
              const barWidth = ((day.commits / maxDayCommits) * 100).toFixed(1);
              const isPeak = punchCard.peakDay?.dayIndex === day.dayIndex;

              return (
                <div key={day.dayIndex} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <div style={{ width: "80px", fontWeight: isPeak ? "600" : "normal" }}>
                    {day.day}
                  </div>
                  <div style={{ flex: 1, height: "16px", backgroundColor: "var(--bg-secondary, #f6f8fa)", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: "100%",
                        backgroundColor: isPeak ? "#0969da" : "var(--border-color, #c9d1d9)",
                        borderRadius: "4px",
                        transition: "width 0.3s"
                      }}
                    />
                  </div>
                  <div style={{ width: "90px", textAlign: "right", fontSize: "12px", color: "var(--text-secondary, #586069)" }}>
                    <strong>{formatNumber(day.commits)}</strong> ({day.percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Commits Stream */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              🕐 Recent Commits Stream
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary, #586069)" }}>
              Latest commits recorded on the default branch
            </p>
          </div>
          <div>
            <input
              type="text"
              placeholder="Search message, author, or SHA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ width: "240px", padding: "6px 12px", fontSize: "13px" }}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: "90px" }}>SHA</th>
                <th>Commit Message</th>
                <th style={{ width: "160px" }}>Author</th>
                <th style={{ width: "120px", textAlign: "right" }}>Age</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecentCommits.length > 0 ? (
                filteredRecentCommits.map((commit) => (
                  <tr key={commit.sha}>
                    <td>
                      <a
                        href={commit.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "var(--primary-color, #0969da)",
                          fontFamily: "monospace",
                          fontSize: "13px",
                          fontWeight: "600"
                        }}
                      >
                        {commit.sha}
                      </a>
                    </td>
                    <td style={{ maxWidth: "450px" }}>
                      <span style={{ fontSize: "14px" }}>
                        {commit.message?.substring(0, 90)}
                        {commit.message?.length > 90 ? "..." : ""}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px", color: "var(--text-secondary, #586069)" }}>
                      {commit.author}
                    </td>
                    <td style={{ fontSize: "13px", color: "var(--text-secondary, #586069)", textAlign: "right", whiteSpace: "nowrap" }}>
                      {timeAgo(commit.date)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary, #586069)" }}>
                    No commits match &quot;{searchTerm}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper to format hour for punch card tooltip
function formatHour(hour) {
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}
