import { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWatchlist } from "../context/watchlistContext";
import { formatNumber, timeAgo } from "../utils/helpers";

const POPULAR_SUGGESTIONS = [
  { fullName: "facebook/react", language: "JavaScript", stars: 228000, forks: 46000, description: "The library for web and native user interfaces." },
  { fullName: "microsoft/vscode", language: "TypeScript", stars: 162000, forks: 30000, description: "Visual Studio Code editor." },
  { fullName: "torvalds/linux", language: "C", stars: 180000, forks: 54000, description: "Linux kernel source tree." },
  { fullName: "vuejs/core", language: "TypeScript", stars: 46000, forks: 8000, description: "Vue.js core repository." },
  { fullName: "nodejs/node", language: "JavaScript", stars: 108000, forks: 29000, description: "Node.js JavaScript runtime." }
];

function Watchlist() {
  const {
    watchlist,
    count,
    removeFromWatchlist,
    addToWatchlist,
    updateNote,
    clearWatchlist,
    exportWatchlist,
    importWatchlist
  } = useWatchlist();

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [sortBy, setSortBy] = useState("addedAt_desc");
  const [editingNote, setEditingNote] = useState(null); // fullName of item being edited
  const [noteText, setNoteText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Unique languages for filter dropdown
  const languages = useMemo(() => {
    const set = new Set();
    watchlist.forEach((item) => {
      if (item.language && item.language !== "Unknown") {
        set.add(item.language);
      }
    });
    return Array.from(set).sort();
  }, [watchlist]);

  // Filtered and sorted watchlist
  const filteredItems = useMemo(() => {
    return watchlist
      .filter((item) => {
        const matchesSearch =
          item.fullName.toLowerCase().includes(search.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
          (item.note && item.note.toLowerCase().includes(search.toLowerCase()));

        const matchesLang =
          selectedLanguage === "all" ||
          (item.language && item.language.toLowerCase() === selectedLanguage.toLowerCase());

        return matchesSearch && matchesLang;
      })
      .sort((a, b) => {
        if (sortBy === "stars_desc") return (b.stars || 0) - (a.stars || 0);
        if (sortBy === "stars_asc") return (a.stars || 0) - (b.stars || 0);
        if (sortBy === "name_asc") return a.fullName.localeCompare(b.fullName);
        if (sortBy === "name_desc") return b.fullName.localeCompare(a.fullName);
        // Default: addedAt_desc
        return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
      });
  }, [watchlist, search, selectedLanguage, sortBy]);

  const handleStartEditNote = (item) => {
    setEditingNote(item.fullName);
    setNoteText(item.note || "");
  };

  const handleSaveNote = (fullName) => {
    updateNote(fullName, noteText);
    setEditingNote(null);
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        const added = importWatchlist(parsed);
        setStatusMessage(`Successfully imported ${added} new repositories!`);
        setTimeout(() => setStatusMessage(""), 4000);
      } catch (err) {
        setStatusMessage(`Failed to import JSON: ${err.message}`);
        setTimeout(() => setStatusMessage(""), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to remove all repositories from your watchlist?")) {
      clearWatchlist();
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className="page-title">🔖 Saved Repositories & Watchlist</h1>
          <p className="page-subtitle">
            {count} {count === 1 ? "repository" : "repositories"} saved for quick inspection, comparison, and analysis.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {count > 0 && (
            <>
              <button
                onClick={exportWatchlist}
                className="btn btn-secondary btn-sm"
                type="button"
                title="Export your watchlist to JSON"
              >
                📤 Export JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
                type="button"
                title="Import watchlist from JSON file"
              >
                📥 Import
              </button>
              <button
                onClick={handleClearAll}
                className="btn btn-danger btn-sm"
                type="button"
                title="Remove all saved repositories"
              >
                🗑️ Clear All
              </button>
            </>
          )}
          {count === 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
              type="button"
              title="Import watchlist from JSON file"
            >
              📥 Import JSON
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json,application/json"
            style={{ display: "none" }}
          />
        </div>
      </div>

      {statusMessage && (
        <div style={{
          padding: "10px 16px", marginBottom: 20, borderRadius: 8,
          background: "var(--primary-light)", color: "var(--primary)",
          border: "1px solid var(--border)", fontSize: 13, fontWeight: 600
        }}>
          {statusMessage}
        </div>
      )}

      {/* Search, Filter & Sort Controls */}
      {count > 0 && (
        <div className="card" style={{ marginBottom: 24, padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <input
                type="text"
                placeholder="Search saved repos or personal notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "8px 14px", borderRadius: 6,
                  border: "1px solid var(--border)", fontSize: 13
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
                Language:
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{
                  padding: "8px 12px", borderRadius: 6,
                  border: "1px solid var(--border)", fontSize: 13
                }}
              >
                <option value="all">All ({count})</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>

              <label style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
                Sort:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "8px 12px", borderRadius: 6,
                  border: "1px solid var(--border)", fontSize: 13
                }}
              >
                <option value="addedAt_desc">Recently Added</option>
                <option value="stars_desc">Most Stars ⭐</option>
                <option value="stars_asc">Least Stars</option>
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {count === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "60px 24px", marginBottom: 30 }}>
          <div style={{ fontSize: 54, marginBottom: 16 }}>⭐</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
            Your Watchlist is Empty
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto 24px", fontSize: 14 }}>
            Save repositories while browsing to easily jump back to them, track their release velocity, compare metrics, and read AI insights.
          </p>

          <div style={{ marginTop: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
              💡 Quick-add popular repositories to get started:
            </h4>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {POPULAR_SUGGESTIONS.map((s) => (
                <button
                  key={s.fullName}
                  type="button"
                  onClick={() => addToWatchlist(s)}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: 16 }}
                >
                  ➕ {s.fullName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtered empty state */}
      {count > 0 && filteredItems.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0 }}>
            No saved repositories matched &quot;{search}&quot;. Try clearing filters.
          </p>
        </div>
      )}

      {/* Grid of Saved Repos */}
      {filteredItems.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filteredItems.map((item) => {
            const [owner, repo] = item.fullName.split("/");
            const isEditingThis = editingNote === item.fullName;

            return (
              <div
                key={item.fullName}
                className="card"
                style={{
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
              >
                <div>
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <div>
                      <Link
                        to={`/dashboard/${owner}/${repo}`}
                        style={{
                          fontSize: 16, fontWeight: 700, textDecoration: "none",
                          color: "var(--primary)", wordBreak: "break-word"
                        }}
                      >
                        {item.fullName}
                      </Link>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        Saved {timeAgo(item.addedAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromWatchlist(item.fullName)}
                      type="button"
                      title="Remove from watchlist"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--text-muted)", fontSize: 16, padding: "2px 6px"
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: 13, color: "var(--text-secondary)", marginBottom: 12,
                    lineHeight: 1.5, minHeight: 38
                  }}>
                    {item.description || "No description provided."}
                  </p>

                  {/* Stats and Language */}
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#f4a900" }}>
                      ⭐ {formatNumber(item.stars)}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      🍴 {formatNumber(item.forks)}
                    </span>
                    {item.language && (
                      <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                        🌐 {item.language}
                      </span>
                    )}
                  </div>

                  {/* Note Section */}
                  <div style={{
                    marginBottom: 14, padding: "8px 10px", borderRadius: 6,
                    background: "var(--bg-tertiary)", fontSize: 12
                  }}>
                    {isEditingThis ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="text"
                          value={noteText}
                          placeholder="Add personal note or tag..."
                          onChange={(e) => setNoteText(e.target.value)}
                          autoFocus
                          style={{
                            flex: 1, padding: "4px 8px", borderRadius: 4,
                            border: "1px solid var(--border)", fontSize: 12
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveNote(item.fullName)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: "4px 8px", fontSize: 11 }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingNote(null)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "4px 8px", fontSize: 11 }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEditNote(item)}
                        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        title="Click to edit personal note"
                      >
                        <span style={{ color: item.note ? "var(--text-primary)" : "var(--text-muted)", fontStyle: item.note ? "normal" : "italic" }}>
                          📝 {item.note || "Add personal note..."}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--primary)" }}>✏️</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Links */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
                  paddingTop: 12, borderTop: "1px solid var(--border)"
                }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: "center" }}
                    onClick={() => navigate(`/dashboard/${owner}/${repo}`)}
                  >
                    📋 Overview
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ justifyContent: "center" }}
                    onClick={() => navigate(`/ai/${owner}/${repo}`)}
                  >
                    🤖 AI Insights
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: "center" }}
                    onClick={() => navigate(`/compare/${owner}/${repo}/facebook/react`)}
                  >
                    ⚔️ Compare
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: "center" }}
                    onClick={() => navigate(`/report/${owner}/${repo}`)}
                  >
                    📑 Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Watchlist;
