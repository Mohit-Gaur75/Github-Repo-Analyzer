import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/themeContext";
import { useWatchlist } from "../context/watchlistContext";
import { parseGitHubUrl } from "../utils/helpers";

function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme, isDark } = useTheme();
  const { watchlist, isWatchlisted, toggleWatchlist } = useWatchlist();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Detect current repo if active on a repo page
  const repoMatch = location.pathname.match(
    /\/(dashboard|languages|techstack|commits|contributors|issues|prs|releases|quality|complexity|security|sbom|ai|activity|trends|report)\/([^/]+)\/([^/]+)/
  );
  const currentOwner = repoMatch ? repoMatch[2] : null;
  const currentRepo = repoMatch ? repoMatch[3] : null;
  const currentFullName = currentOwner && currentRepo ? `${currentOwner}/${currentRepo}` : null;
  const currentSaved = currentFullName ? isWatchlisted(currentFullName) : false;

  // Build commands list
  const commands = useMemo(() => {
    const list = [];

    // 1. Current Repository Context Actions
    if (currentOwner && currentRepo) {
      list.push(
        {
          id: "repo-overview",
          category: `Current Repo (${currentFullName})`,
          label: "📋 Go to Overview",
          action: () => navigate(`/dashboard/${currentOwner}/${currentRepo}`),
          keywords: "overview dashboard main info"
        },
        {
          id: "repo-ai",
          category: `Current Repo (${currentFullName})`,
          label: "🤖 View AI Insights",
          action: () => navigate(`/ai/${currentOwner}/${currentRepo}`),
          keywords: "ai insights summary artificial intelligence"
        },
        {
          id: "repo-security",
          category: `Current Repo (${currentFullName})`,
          label: "🔒 Security & CVE Scan",
          action: () => navigate(`/security/${currentOwner}/${currentRepo}`),
          keywords: "security cve vulnerabilities osv dependencies"
        },
        {
          id: "repo-sbom",
          category: `Current Repo (${currentFullName})`,
          label: "📦 Software Bill of Materials (SBOM)",
          action: () => navigate(`/sbom/${currentOwner}/${currentRepo}`),
          keywords: "sbom software bill materials spdx cyclonedx packages dependencies purl"
        },
        {
          id: "repo-techstack",
          category: `Current Repo (${currentFullName})`,
          label: "🛠️ Tech Stack & Architecture",
          action: () => navigate(`/techstack/${currentOwner}/${currentRepo}`),
          keywords: "tech stack architecture dependencies frameworks"
        },
        {
          id: "repo-complexity",
          category: `Current Repo (${currentFullName})`,
          label: "🗺️ Code Complexity & Hotspots",
          action: () => navigate(`/complexity/${currentOwner}/${currentRepo}`),
          keywords: "complexity churn hotspots code debt loc refactoring"
        },
        {
          id: "repo-trends",
          category: `Current Repo (${currentFullName})`,
          label: "📈 Star Trends & Projection",
          action: () => navigate(`/trends/${currentOwner}/${currentRepo}`),
          keywords: "trends star growth velocity projection"
        },
        {
          id: "repo-activity",
          category: `Current Repo (${currentFullName})`,
          label: "📊 Live Activity Feed (SSE)",
          action: () => navigate(`/activity/${currentOwner}/${currentRepo}`),
          keywords: "activity real-time live events feed commits"
        },
        {
          id: "repo-releases",
          category: `Current Repo (${currentFullName})`,
          label: "🏷️ Releases & Versioning",
          action: () => navigate(`/releases/${currentOwner}/${currentRepo}`),
          keywords: "releases tags semver cadence version"
        },
        {
          id: "repo-contributors",
          category: `Current Repo (${currentFullName})`,
          label: "👥 Contributors & Bus Factor",
          action: () => navigate(`/contributors/${currentOwner}/${currentRepo}`),
          keywords: "contributors bus factor team members"
        },
        {
          id: "repo-report",
          category: `Current Repo (${currentFullName})`,
          label: "📑 Export Executive Audit Report",
          action: () => navigate(`/report/${currentOwner}/${currentRepo}`),
          keywords: "report audit pdf export print executive"
        },
        {
          id: "repo-watchlist-toggle",
          category: `Current Repo (${currentFullName})`,
          label: currentSaved ? "⭐ Remove from Watchlist" : "⭐ Save to Watchlist",
          action: () => toggleWatchlist({ fullName: currentFullName, owner: currentOwner, repo: currentRepo }),
          keywords: "watchlist star bookmark favorite pin"
        }
      );
    }

    // 2. Global Navigation
    list.push(
      {
        id: "nav-home",
        category: "Navigation",
        label: "🏠 Home",
        action: () => navigate("/"),
        keywords: "home start landing"
      },
      {
        id: "nav-discover",
        category: "Navigation",
        label: "🔥 Trending & Discovery",
        action: () => navigate("/discover"),
        keywords: "trending discover explore repos top github"
      },
      {
        id: "nav-watchlist",
        category: "Navigation",
        label: "🔖 Saved Watchlist",
        action: () => navigate("/watchlist"),
        keywords: "watchlist saved bookmarks favorites"
      },
      {
        id: "nav-compare",
        category: "Navigation",
        label: "⚔️ Compare Repositories",
        action: () => navigate("/compare"),
        keywords: "compare side by side diff head to head"
      },
      {
        id: "nav-user",
        category: "Navigation",
        label: "👤 Developer Profile Analyzer",
        action: () => navigate("/user"),
        keywords: "user developer profile maintainer github account"
      }
    );

    // 3. System Actions
    list.push({
      id: "action-theme",
      category: "Preferences",
      label: isDark ? "☀️ Switch to Light Mode" : "🌙 Switch to Dark Mode",
      action: toggleTheme,
      keywords: "theme dark light mode color toggle appearance"
    });

    // 4. Saved Watchlist Repositories (Quick jump)
    watchlist.forEach((w) => {
      list.push({
        id: `watchlist-${w.fullName}`,
        category: "Saved in Watchlist",
        label: `⭐ ${w.fullName}`,
        description: w.description || "",
        action: () => {
          const [o, r] = w.fullName.split("/");
          navigate(`/dashboard/${o}/${r}`);
        },
        keywords: `${w.fullName} ${w.language || ""} ${w.note || ""}`
      });
    });

    return list;
  }, [currentOwner, currentRepo, currentFullName, currentSaved, isDark, watchlist, navigate, toggleTheme, toggleWatchlist]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase().trim();

    // Check if query looks like a repo search e.g. "facebook/react" or "react"
    return commands.filter((c) => {
      return (
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.keywords && c.keywords.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [commands, query]);

  // Keyboard navigation & search focus
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      } else if (query.includes("/")) {
        // Direct jump to typed repo e.g. "torvalds/linux"
        try {
          const { owner, repo } = parseGitHubUrl(query);
          navigate(`/dashboard/${owner}/${repo}`);
          onClose();
        } catch {
          // invalid repo format
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 620,
          backgroundColor: "var(--bg-primary)",
          borderRadius: "14px",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "75vh"
        }}
      >
        {/* Search Input Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg-primary)"
        }}>
          <span style={{ fontSize: 18, color: "var(--text-muted)" }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or repo (e.g. facebook/react, AI, theme)..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 16,
              background: "transparent",
              color: "var(--text-primary)"
            }}
          />
          <button
            onClick={onClose}
            type="button"
            title="Close (Esc)"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              cursor: "pointer"
            }}
          >
            ESC
          </button>
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px"
          }}
        >
          {filteredCommands.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-secondary)" }}>
              <p style={{ margin: 0, fontSize: 14 }}>
                No commands matching &quot;{query}&quot;.
              </p>
              {query.includes("/") && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={() => {
                    try {
                      const { owner, repo } = parseGitHubUrl(query);
                      navigate(`/dashboard/${owner}/${repo}`);
                      onClose();
                    } catch {
                      // ignore
                    }
                  }}
                >
                  🔍 Analyze &quot;{query}&quot; directly →
                </button>
              )}
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  data-selected={isSelected}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "var(--primary-light)" : "transparent",
                    color: isSelected ? "var(--primary)" : "var(--text-primary)",
                    transition: "background 0.1s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 500 }}>
                      {cmd.label}
                    </span>
                    {cmd.description && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {cmd.description.slice(0, 45)}...
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-muted)",
                    fontWeight: 600
                  }}>
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div style={{
          padding: "10px 18px",
          borderTop: "1px solid var(--border)",
          backgroundColor: "var(--bg-secondary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "var(--text-muted)"
        }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span><kbd style={kbdStyle}>↑</kbd> <kbd style={kbdStyle}>↓</kbd> navigate</span>
            <span><kbd style={kbdStyle}>↵</kbd> select</span>
            <span><kbd style={kbdStyle}>esc</kbd> close</span>
          </div>
          <span>Tip: Press <kbd style={kbdStyle}>Ctrl+K</kbd> anywhere</span>
        </div>
      </div>
    </div>
  );
}

const kbdStyle = {
  backgroundColor: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: "3px",
  padding: "1px 5px",
  fontFamily: "monospace",
  fontSize: "10px"
};

export default CommandPalette;
