import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile } from "../api/apiService";
import { formatNumber, timeAgo } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const POPULAR_USERS = [
  { name: "Linus Torvalds", username: "torvalds" },
  { name: "Dan Abramov", username: "gaearon" },
  { name: "Evan You", username: "yyx990803" },
  { name: "Anthony Fu", username: "antfu" },
  { name: "Sindre Sorhus", username: "sindresorhus" }
];

function DeveloperProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [input, setInput] = useState(username || "torvalds");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeUser = username || "torvalds";

  useEffect(() => {
    setInput(activeUser);
    setLoading(true);
    setError("");

    getUserProfile(activeUser)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeUser]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const clean = input.trim().replace(/^@/, "");
    if (!clean) return;
    navigate(`/user/${clean}`);
  };

  const handleSelectUser = (u) => {
    setInput(u);
    navigate(`/user/${u}`);
  };

  return (
    <div>
      {/* Search Header */}
      <div className="page-header" style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 className="page-title" style={{ fontSize: "28px", fontWeight: "800" }}>
          👤 Developer & Maintainer Analyzer
        </h1>
        <p className="page-subtitle">
          Discover a developer's total impact, score, top technologies, and notable repositories.
        </p>

        {/* Search input */}
        <div style={{ maxWidth: "560px", margin: "16px auto 0" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter GitHub username (e.g. torvalds)..."
              style={{
                flex: 1, padding: "12px 16px", borderRadius: "8px",
                border: "1px solid var(--border)", fontSize: "14px", outline: "none",
                backgroundColor: "var(--bg-primary)"
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "12px 20px" }}>
              🔍 Analyze
            </button>
          </form>

          {/* Quick presets */}
          <div style={{ marginTop: "10px", display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", alignSelf: "center" }}>Popular:</span>
            {POPULAR_USERS.map((u) => (
              <button
                key={u.username}
                type="button"
                onClick={() => handleSelectUser(u.username)}
                style={{
                  background: activeUser === u.username ? "var(--primary)" : "var(--bg-tertiary)",
                  color: activeUser === u.username ? "#ffffff" : "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  padding: "3px 10px",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => handleSearch()} />}
      {loading && <LoadingSpinner message={`Analyzing GitHub profile of ${activeUser}...`} />}

      {!loading && data && (
        <div>
          {/* Profile Hero Card */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
              <img
                src={data.profile.avatar}
                alt={data.profile.username}
                style={{
                  width: "90px", height: "90px", borderRadius: "50%",
                  border: "3px solid #0366d6", flexShrink: 0
                }}
              />
              <div style={{ flex: 1, minWidth: "240px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>
                    {data.profile.name}
                  </h2>
                  <a
                    href={data.profile.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "14px", color: "#0366d6", textDecoration: "none" }}
                  >
                    @{data.profile.username} ↗
                  </a>
                  <span className="badge badge-info">{data.profile.type}</span>
                </div>

                {data.profile.bio && (
                  <p style={{ fontSize: "14px", color: "#444", marginBottom: "12px", maxWidth: "680px" }}>
                    {data.profile.bio}
                  </p>
                )}

                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "13px", color: "#586069" }}>
                  {data.profile.company && <span>🏢 {data.profile.company}</span>}
                  {data.profile.location && <span>📍 {data.profile.location}</span>}
                  {data.profile.blog && (
                    <a
                      href={data.profile.blog.startsWith("http") ? data.profile.blog : `https://${data.profile.blog}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#0366d6", textDecoration: "none" }}
                    >
                      🔗 {data.profile.blog}
                    </a>
                  )}
                  {data.profile.twitter && (
                    <span>🐦 @{data.profile.twitter}</span>
                  )}
                  <span>📅 Active for {data.profile.accountAge}</span>
                </div>
              </div>

              {/* Overall Score Badge */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #0366d6 0%, #1e40af 100%)",
                  color: "#ffffff",
                  textAlign: "center",
                  minWidth: "160px"
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", opacity: 0.9 }}>
                  Developer Score
                </div>
                <div style={{ fontSize: "36px", fontWeight: "800", margin: "4px 0" }}>
                  {data.score.overallScore}
                  <span style={{ fontSize: "16px", opacity: 0.8 }}>/100</span>
                </div>
                <div style={{ fontSize: "12px", fontWeight: "600", background: "rgba(255,255,255,0.2)", borderRadius: "10px", padding: "2px 8px" }}>
                  {data.score.badge}
                </div>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid-4" style={{ marginBottom: "24px" }}>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-value">{formatNumber(data.stats.totalStars)}</div>
              <div className="stat-label">Total Stars Earned</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🍴</div>
              <div className="stat-value">{formatNumber(data.stats.totalForks)}</div>
              <div className="stat-label">Total Forks</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{formatNumber(data.profile.followers)}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-value">{formatNumber(data.profile.publicRepos)}</div>
              <div className="stat-label">Public Repositories</div>
            </div>
          </div>

          {/* Languages & Score Breakdown */}
          <div className="grid-2" style={{ marginBottom: "24px" }}>
            {/* Top Languages */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "16px" }}>🌐 Top Languages</h3>
              {data.topLanguages.length === 0 ? (
                <p style={{ color: "#586069", fontSize: "14px" }}>No public code repository languages recorded.</p>
              ) : (
                data.topLanguages.slice(0, 6).map((lang) => (
                  <div key={lang.name} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                      <strong>{lang.name}</strong>
                      <span style={{ color: "#586069" }}>{lang.percentage}% ({lang.count} repos)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${lang.percentage}%`, backgroundColor: "#0366d6" }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Score Breakdown */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "16px" }}>📊 Impact Breakdown</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span>⭐ <strong>Popularity & Stars</strong></span>
                    <span>{data.score.breakdown.popularity} / 40 pts</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(data.score.breakdown.popularity / 40) * 100}%`, backgroundColor: "#f4a900" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span>📦 <strong>Productivity & Longevity</strong></span>
                    <span>{data.score.breakdown.productivity} / 35 pts</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(data.score.breakdown.productivity / 35) * 100}%`, backgroundColor: "#28a745" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span>🔥 <strong>Recent Activity</strong></span>
                    <span>{data.score.breakdown.activity} / 25 pts</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(data.score.breakdown.activity / 25) * 100}%`, backgroundColor: "#6f42c1" }} />
                  </div>
                </div>
              </div>

              {/* Organizations */}
              {data.organizations.length > 0 && (
                <div style={{ marginTop: "20px", borderTop: "1px solid #f0f0f0", paddingTop: "14px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#586069", marginBottom: "10px" }}>
                    ORGANIZATIONS
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {data.organizations.map((org) => (
                      <button
                        key={org.login}
                        type="button"
                        onClick={() => handleSelectUser(org.login)}
                        title={org.login}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "4px 10px", borderRadius: "16px",
                          border: "1px solid var(--border)", background: "var(--bg-tertiary)",
                          color: "var(--text-primary)",
                          cursor: "pointer", fontSize: "12px", fontWeight: "600"
                        }}
                      >
                        <img src={org.avatar} alt={org.login} style={{ width: "18px", height: "18px", borderRadius: "50%" }} />
                        {org.login}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Repositories Grid */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <h3 className="card-title" style={{ marginBottom: "16px" }}>
              🏆 Top Repositories
            </h3>
            <div className="grid-3">
              {data.topRepos.map((repo) => (
                <div
                  key={repo.fullName}
                  style={{
                    border: "1px solid var(--border)", borderRadius: "10px", padding: "16px",
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                    backgroundColor: "var(--bg-primary)", boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                      <h4 style={{ fontSize: "15px", fontWeight: "700", margin: 0 }}>
                        <a href={repo.url} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", textDecoration: "none" }}>
                          {repo.name}
                        </a>
                      </h4>
                      {repo.isFork && <span className="badge badge-secondary" style={{ fontSize: "10px" }}>Fork</span>}
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", minHeight: "36px", marginBottom: "12px" }}>
                      {repo.description ? repo.description.substring(0, 85) + (repo.description.length > 85 ? "..." : "") : "No description provided."}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#586069", marginBottom: "12px" }}>
                      <span>⭐ {formatNumber(repo.stars)}</span>
                      <span>🍴 {formatNumber(repo.forks)}</span>
                      {repo.language && <span>🌐 {repo.language}</span>}
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => navigate(`/dashboard/${data.profile.username}/${repo.name}`)}
                    >
                      📊 Full Analysis →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          {data.recentActivity.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "16px" }}>
                ⚡ Recent Public Activity
              </h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {data.recentActivity.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "10px 0", borderBottom: "1px solid #f0f0f0", fontSize: "13px"
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>{act.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: "600", color: "#24292e" }}>
                        {act.label}{" "}
                        <span style={{ color: "#0366d6" }}>{act.repoName}</span>
                      </span>
                      {act.detail && (
                        <div style={{ fontSize: "12px", color: "#586069", marginTop: "2px" }}>
                          {act.detail}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: "12px", color: "#959da5", whiteSpace: "nowrap" }}>
                      {timeAgo(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DeveloperProfile;
