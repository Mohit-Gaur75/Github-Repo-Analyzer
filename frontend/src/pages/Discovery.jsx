import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTrendingRepos } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import WatchlistButton from "../components/WatchlistButton";
import { formatNumber, timeAgo } from "../utils/helpers";

const TIMEFRAMES = [
  { id: "daily", label: "🔥 Today" },
  { id: "weekly", label: "⭐ This Week" },
  { id: "monthly", label: "📅 This Month" },
  { id: "all", label: "🏆 All Time" }
];

const POPULAR_LANGUAGES = [
  "All",
  "JavaScript",
  "TypeScript",
  "Python",
  "Rust",
  "Go",
  "C++",
  "Java",
  "Swift",
  "Kotlin",
  "Dart",
  "PHP",
  "Ruby"
];

const POPULAR_TOPICS = [
  "all",
  "ai",
  "llm",
  "react",
  "nextjs",
  "machine-learning",
  "devops",
  "cli",
  "rust",
  "security"
];

function Discovery() {
  const navigate = useNavigate();

  const [timeframe, setTimeframe] = useState("weekly");
  const [language, setLanguage] = useState("All");
  const [topic, setTopic] = useState("all");
  const [search, setSearch] = useState("");
  const [queryInput, setQueryInput] = useState("");

  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFallback, setIsFallback] = useState(false);

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTrendingRepos({
        timeframe,
        language: language === "All" ? "" : language,
        topic: topic === "all" ? "" : topic,
        q: search.trim()
      });
      const data = res.data?.data || res.data || {};
      setRepos(data.repositories || []);
      setIsFallback(Boolean(data.isFallback));
    } catch (err) {
      setError(err.message || "Failed to fetch trending repositories");
    } finally {
      setLoading(false);
    }
  }, [timeframe, language, topic, search]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(queryInput);
  };

  const handleClearSearch = () => {
    setQueryInput("");
    setSearch("");
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">🔍 Trending & Repository Discovery</h1>
        <p className="page-subtitle">
          Explore fast-growing open source projects across GitHub. Filter by timeframe, programming language, or topic.
        </p>
      </div>

      {/* Filter and Search Card */}
      <div className="card" style={{ marginBottom: 24, padding: "20px" }}>
        {/* Timeframe tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {TIMEFRAMES.map((t) => {
            const active = timeframe === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: active ? "1px solid var(--primary)" : "1px solid var(--border)",
                  background: active ? "var(--primary)" : "var(--bg-tertiary)",
                  color: active ? "#ffffff" : "var(--text-primary)",
                  fontWeight: active ? "700" : "500",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Language selector & Search box */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          <div style={{ minWidth: 160 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>
              LANGUAGE:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 6,
                border: "1px solid var(--border)", fontSize: 13,
                backgroundColor: "var(--bg-primary)", color: "var(--text-primary)"
              }}
            >
              {POPULAR_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l === "All" ? "🌐 All Languages" : l}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: 260, display: "flex", gap: 6, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>
                KEYWORD OR TOPIC:
              </label>
              <input
                type="text"
                placeholder="e.g. agent, web3, neural, vite..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 6,
                  border: "1px solid var(--border)", fontSize: 13,
                  backgroundColor: "var(--bg-primary)", color: "var(--text-primary)"
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: "9px 16px" }}>
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="btn btn-secondary btn-sm"
                style={{ padding: "9px 12px" }}
                title="Clear keyword search"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Topic chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Popular topics:</span>
          {POPULAR_TOPICS.map((t) => {
            const active = topic === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                style={{
                  padding: "3px 10px",
                  borderRadius: "12px",
                  border: active ? "1px solid var(--primary)" : "1px solid var(--border)",
                  background: active ? "var(--primary-light)" : "var(--bg-tertiary)",
                  color: active ? "var(--primary)" : "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: active ? "700" : "500",
                  cursor: "pointer"
                }}
              >
                #{t}
              </button>
            );
          })}
        </div>
      </div>

      {isFallback && (
        <div style={{
          padding: "10px 16px", marginBottom: 20, borderRadius: 8,
          background: "var(--badge-warning-bg)", color: "var(--badge-warning-text)",
          border: "1px solid var(--border)", fontSize: 13, fontWeight: 600
        }}>
          ⚡ Live GitHub API rate-limited; displaying curated trending projects.
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchTrending} />}

      {loading && <LoadingSpinner message="Searching trending GitHub repositories..." />}

      {/* Repositories List */}
      {!loading && !error && (
        <>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
              Showing {repos.length} trending {repos.length === 1 ? "repository" : "repositories"}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Sorted by stars & activity
            </span>
          </div>

          {repos.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No repositories found</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                Try relaxing the language or topic filters, or try a broader search keyword.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {repos.map((repo, idx) => {
                const [owner, name] = repo.fullName.split("/");
                const rank = idx + 1;
                const rankBadge =
                  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

                return (
                  <div
                    key={repo.fullName}
                    className="card"
                    style={{
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      transition: "transform 0.2s, box-shadow 0.2s"
                    }}
                  >
                    {/* Top Row: Rank, Avatar, Name, Watchlist Button */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{
                          fontSize: rank <= 3 ? 20 : 13,
                          fontWeight: 700,
                          color: rank <= 3 ? "#f4a900" : "var(--text-muted)",
                          minWidth: 28,
                          textAlign: "center"
                        }}>
                          {rankBadge}
                        </span>

                        {repo.owner?.avatar && (
                          <img
                            src={repo.owner.avatar}
                            alt={repo.owner.login}
                            style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border)" }}
                          />
                        )}

                        <div>
                          <Link
                            to={`/dashboard/${owner}/${name}`}
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: "var(--primary)",
                              textDecoration: "none"
                            }}
                          >
                            {repo.fullName}
                          </Link>
                          {repo.pushedAt && (
                            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
                              active {timeAgo(repo.pushedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <WatchlistButton repoData={repo} size="sm" />
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      {repo.description || "No description provided."}
                    </p>

                    {/* Metrics and Topics */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#f4a900" }}>
                          ⭐ {formatNumber(repo.stars)}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                          🍴 {formatNumber(repo.forks)}
                        </span>
                        {repo.language && repo.language !== "Unknown" && (
                          <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                            🌐 {repo.language}
                          </span>
                        )}
                        {repo.license && (
                          <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                            📄 {repo.license}
                          </span>
                        )}
                      </div>

                      {/* Topic Tags */}
                      {repo.topics?.length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {repo.topics.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="tag"
                              style={{ cursor: "pointer", fontSize: 11 }}
                              onClick={() => setTopic(t)}
                              title={`Filter by #${t}`}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div style={{
                      display: "flex", gap: 8, flexWrap: "wrap",
                      paddingTop: 10, borderTop: "1px solid var(--border)"
                    }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/dashboard/${owner}/${name}`)}
                      >
                        📋 Full Analysis
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/ai/${owner}/${name}`)}
                      >
                        🤖 AI Insights
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/compare/${owner}/${name}/facebook/react`)}
                      >
                        ⚔️ Compare
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/security/${owner}/${name}`)}
                      >
                        🔒 Security
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Discovery;
