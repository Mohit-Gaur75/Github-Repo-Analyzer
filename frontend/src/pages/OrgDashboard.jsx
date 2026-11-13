import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getOrgPortfolio } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import StatCard from "../components/StatCard";
import WatchlistButton from "../components/WatchlistButton";
import { formatNumber, timeAgo } from "../utils/helpers";

const POPULAR_ORGS = [
  "vercel",
  "tailwindlabs",
  "facebook",
  "microsoft",
  "google",
  "shadcn",
  "freeCodeCamp"
];

function OrgDashboard() {
  const { org: paramOrg } = useParams();
  const navigate = useNavigate();

  const [inputOrg, setInputOrg] = useState(paramOrg || "vercel");
  const [activeOrg, setActiveOrg] = useState(paramOrg || "vercel");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchRepo, setSearchRepo] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("stars");

  useEffect(() => {
    if (paramOrg && paramOrg !== activeOrg) {
      setActiveOrg(paramOrg);
      setInputOrg(paramOrg);
    }
  }, [paramOrg, activeOrg]);

  useEffect(() => {
    if (!activeOrg) return;
    setLoading(true);
    setError("");
    getOrgPortfolio(activeOrg)
      .then((res) => setData(res.data?.data || res.data))
      .catch((err) => setError(err.message || "Failed to load organization portfolio"))
      .finally(() => setLoading(false));
  }, [activeOrg]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputOrg.trim()) {
      const clean = inputOrg.trim().toLowerCase();
      setActiveOrg(clean);
      navigate(`/org/${clean}`);
    }
  };

  const handleSelectPreset = (name) => {
    setInputOrg(name);
    setActiveOrg(name);
    navigate(`/org/${name}`);
  };

  // Filtered and sorted repositories
  const filteredRepos = useMemo(() => {
    if (!data?.allRepos) return [];
    return data.allRepos
      .filter((r) => {
        const matchesSearch =
          r.name.toLowerCase().includes(searchRepo.toLowerCase()) ||
          (r.description && r.description.toLowerCase().includes(searchRepo.toLowerCase()));

        const matchesLang =
          selectedLanguage === "all" ||
          (r.language && r.language.toLowerCase() === selectedLanguage.toLowerCase());

        const matchesStatus =
          selectedStatus === "all" || r.status === selectedStatus;

        return matchesSearch && matchesLang && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "stars") return b.stars - a.stars;
        if (sortBy === "forks") return b.forks - a.forks;
        if (sortBy === "issues") return b.openIssues - a.openIssues;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "pushed") return new Date(b.pushedAt || 0) - new Date(a.pushedAt || 0);
        return 0;
      });
  }, [data, searchRepo, selectedLanguage, selectedStatus, sortBy]);

  const languagesList = useMemo(() => {
    if (!data?.languages) return [];
    return data.languages.map((l) => l.name);
  }, [data]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Search Header */}
      <div className="card" style={{ marginBottom: 24, padding: "24px" }}>
        <h1 className="page-title" style={{ fontSize: 24, marginBottom: 8 }}>
          🏢 Multi-Repo Organization & Portfolio Dashboard
        </h1>
        <p className="page-subtitle" style={{ marginBottom: 16 }}>
          Analyze an entire GitHub organization or creator portfolio at once. Aggregated stars, maintenance health, and engineering KPIs.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, maxWidth: 560, marginBottom: 12 }}>
          <input
            type="text"
            value={inputOrg}
            onChange={(e) => setInputOrg(e.target.value)}
            placeholder="Enter org (e.g. vercel, tailwindlabs, facebook)..."
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 8,
              border: "1px solid var(--border)", fontSize: 14,
              backgroundColor: "var(--bg-primary)", color: "var(--text-primary)"
            }}
          />
          <button type="submit" className="btn btn-primary">
            🔍 Analyze Portfolio
          </button>
        </form>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Popular orgs:</span>
          {POPULAR_ORGS.map((orgName) => (
            <button
              key={orgName}
              type="button"
              onClick={() => handleSelectPreset(orgName)}
              style={{
                padding: "2px 10px", borderRadius: 14, fontSize: 12,
                border: "1px solid var(--border)",
                background: activeOrg.toLowerCase() === orgName.toLowerCase() ? "var(--primary)" : "var(--bg-tertiary)",
                color: activeOrg.toLowerCase() === orgName.toLowerCase() ? "#fff" : "var(--text-secondary)",
                cursor: "pointer", fontWeight: 600
              }}
            >
              {orgName}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingSpinner message={`Aggregating portfolio intelligence for "${activeOrg}"...`} />}
      {error && <ErrorMessage message={error} onRetry={() => setActiveOrg(activeOrg)} />}

      {!loading && !error && data && (
        <>
          {/* Org Profile Header Card */}
          <div className="card" style={{ marginBottom: 24, padding: "24px" }}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
              {data.organization.avatar && (
                <img
                  src={data.organization.avatar}
                  alt={data.organization.name}
                  style={{ width: 80, height: 80, borderRadius: "50%", border: "2px solid var(--border)" }}
                />
              )}
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                      {data.organization.name}
                    </h2>
                    <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
                      @{data.organization.login} · {data.organization.type}
                    </span>
                  </div>
                  <a
                    href={data.organization.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    GitHub ↗
                  </a>
                </div>

                {data.organization.description && (
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "10px 0 12px", lineHeight: 1.5 }}>
                    {data.organization.description}
                  </p>
                )}

                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "var(--text-secondary)" }}>
                  {data.organization.location && (
                    <span>📍 {data.organization.location}</span>
                  )}
                  {data.organization.blog && (
                    <a
                      href={data.organization.blog.startsWith("http") ? data.organization.blog : `https://${data.organization.blog}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--primary)", textDecoration: "none" }}
                    >
                      🔗 {data.organization.blog}
                    </a>
                  )}
                  <span>👥 {formatNumber(data.organization.followers)} followers</span>
                  <span>📅 Active since {new Date(data.organization.createdAt).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Stat Cards */}
          <div className="grid-4" style={{ marginBottom: 24 }}>
            <StatCard
              icon="🏢"
              value={formatNumber(data.stats.totalRepos)}
              label="Public Repositories"
              color="#0366d6"
            />
            <StatCard
              icon="⭐"
              value={formatNumber(data.stats.totalStars)}
              label="Aggregate Stars"
              color="#f4a900"
            />
            <StatCard
              icon="🍴"
              value={formatNumber(data.stats.totalForks)}
              label="Total Forks"
              color="#28a745"
            />
            <StatCard
              icon="🐛"
              value={formatNumber(data.stats.totalOpenIssues)}
              label="Open Issues"
              color="#dc3545"
            />
          </div>

          {/* Health & Maintenance Alert Banner */}
          <div className="card" style={{ marginBottom: 24, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                    Portfolio Health Score:
                  </span>
                  <span className={`badge ${data.stats.healthGrade === "A+" || data.stats.healthGrade === "A" ? "badge-success" : data.stats.healthGrade === "B" ? "badge-info" : "badge-warning"}`} style={{ fontSize: 14, fontWeight: 700 }}>
                    {data.stats.healthGrade} ({data.stats.healthScore}%)
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                  {data.stats.activeRepos30d} of {data.stats.totalRepos} repositories pushed within the last 30 days. Average {formatNumber(data.stats.avgStarsPerRepo)} stars/repo.
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="badge badge-success" style={{ fontSize: 11 }}>
                  🟢 {data.stats.activeRepos30d} Active
                </span>
                {data.stats.staleReposCount > 0 && (
                  <span className="badge badge-warning" style={{ fontSize: 11 }}>
                    🟡 {data.stats.staleReposCount} Stale
                  </span>
                )}
                {data.stats.archivedReposCount > 0 && (
                  <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                    📦 {data.stats.archivedReposCount} Archived
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Language Tech Stack Breakdown */}
          {data.languages?.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 className="card-title" style={{ marginBottom: 14 }}>
                🌐 Organization Technology Distribution
              </h3>
              <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
                {data.languages.slice(0, 8).map((l, i) => {
                  const colors = ["#0366d6", "#6f42c1", "#28a745", "#f4a900", "#e36209", "#d73a49", "#005cc5", "#586069"];
                  return (
                    <div
                      key={l.name}
                      style={{
                        width: `${l.percentage}%`,
                        backgroundColor: colors[i % colors.length]
                      }}
                      title={`${l.name}: ${l.count} repos (${l.percentage}%)`}
                    />
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
                {data.languages.slice(0, 8).map((l) => (
                  <span key={l.name} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{l.name}:</span>
                    <span style={{ color: "var(--text-secondary)" }}>{l.percentage}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top Powerhouse Repositories */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: "var(--text-primary)" }}>
              ⭐ Top Powerhouse Repositories
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              {data.topRepos.map((repo, idx) => {
                const [rOwner, rName] = repo.fullName.split("/");
                return (
                  <div key={repo.fullName} className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                        <Link
                          to={`/dashboard/${rOwner}/${rName}`}
                          style={{ fontSize: 15, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}
                        >
                          #{idx + 1} {repo.name}
                        </Link>
                        <WatchlistButton repoData={repo} size="sm" />
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, minHeight: 36, marginBottom: 10 }}>
                        {repo.description ? repo.description.slice(0, 95) + (repo.description.length > 95 ? "..." : "") : "No description provided."}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: "flex", gap: 12, fontSize: 12, marginBottom: 10, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: "#f4a900" }}>⭐ {formatNumber(repo.stars)}</span>
                        <span style={{ color: "var(--text-secondary)" }}>🍴 {formatNumber(repo.forks)}</span>
                        <span style={{ color: "var(--text-secondary)" }}>🌐 {repo.language}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, justifyContent: "center" }}
                          onClick={() => navigate(`/dashboard/${rOwner}/${rName}`)}
                        >
                          📋 Overview
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, justifyContent: "center" }}
                          onClick={() => navigate(`/ai/${rOwner}/${rName}`)}
                        >
                          🤖 AI
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Repositories Inventory Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 30 }}>
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  📁 All Repositories ({filteredRepos.length})
                </h3>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Filterable portfolio table with one-click deep analysis
                </span>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Filter repos..."
                  value={searchRepo}
                  onChange={(e) => setSearchRepo(e.target.value)}
                  style={{
                    padding: "6px 10px", borderRadius: 6, fontSize: 12,
                    border: "1px solid var(--border)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)"
                  }}
                />

                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  style={{
                    padding: "6px 10px", borderRadius: 6, fontSize: 12,
                    border: "1px solid var(--border)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)"
                  }}
                >
                  <option value="all">All Languages</option>
                  {languagesList.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    padding: "6px 10px", borderRadius: 6, fontSize: 12,
                    border: "1px solid var(--border)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)"
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="stale">Stale (At Risk)</option>
                  <option value="archived">Archived</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: "6px 10px", borderRadius: 6, fontSize: 12,
                    border: "1px solid var(--border)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)"
                  }}
                >
                  <option value="stars">Most Stars</option>
                  <option value="forks">Most Forks</option>
                  <option value="pushed">Recently Pushed</option>
                  <option value="issues">Most Issues</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="table-container" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>Repository</th>
                    <th>Language</th>
                    <th>Stars</th>
                    <th>Forks</th>
                    <th>Issues</th>
                    <th>Status</th>
                    <th>Last Push</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepos.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                        No repositories matched the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRepos.map((r) => {
                      const [rOwner, rName] = r.fullName.split("/");
                      const statusBadge =
                        r.status === "active"
                          ? "badge-success"
                          : r.status === "stale"
                          ? "badge-warning"
                          : "badge-secondary";

                      return (
                        <tr key={r.fullName}>
                          <td>
                            <Link
                              to={`/dashboard/${rOwner}/${rName}`}
                              style={{ fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}
                            >
                              {r.name}
                            </Link>
                            {r.description && (
                              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {r.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                              {r.language}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: "#f4a900" }}>
                            {formatNumber(r.stars)}
                          </td>
                          <td>{formatNumber(r.forks)}</td>
                          <td>{formatNumber(r.openIssues)}</td>
                          <td>
                            <span className={`badge ${statusBadge}`} style={{ fontSize: 11 }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {r.pushedAt ? timeAgo(r.pushedAt) : "N/A"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: 6 }}>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                style={{ padding: "3px 8px", fontSize: 11 }}
                                onClick={() => navigate(`/dashboard/${rOwner}/${rName}`)}
                              >
                                Analyze
                              </button>
                              <WatchlistButton repoData={r} size="sm" />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default OrgDashboard;
