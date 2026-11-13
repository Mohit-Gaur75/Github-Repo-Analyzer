import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { parseGitHubUrl } from "../utils/helpers";
import ThemeToggle from "./ThemeToggle";
import { useWatchlist } from "../context/watchlistContext";

function Navbar({ onOpenPalette }) {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { count } = useWatchlist();

  const handleSearch = (e) => {
    e.preventDefault();
    setError("");
    try {
      const { owner, repo } = parseGitHubUrl(search);
      navigate(`/dashboard/${owner}/${repo}`);
      setSearch("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          📊 GitHub Analyzer
        </Link>
        <Link to="/discover" style={styles.navLink}>
          🔥 Trending
        </Link>
        <Link to="/compare" style={styles.navLink}>
          ⚔️ Compare
        </Link>
        <Link to="/user" style={styles.navLink}>
          👤 Dev Profile
        </Link>
        <Link to="/org" style={styles.navLink}>
          🏢 Org
        </Link>
        <Link to="/watchlist" style={styles.navLink}>
          🔖 Watchlist
          {count > 0 && <span style={styles.counter}>{count}</span>}
        </Link>
        <form onSubmit={handleSearch} style={styles.form}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="owner/repo or GitHub URL..."
            style={styles.input}
          />
          <button type="submit" style={styles.btn}>
            🔍 Analyze
          </button>
        </form>
        <button
          type="button"
          onClick={onOpenPalette}
          title="Open Command Palette (Ctrl+K or ⌘K)"
          style={styles.paletteBtn}
        >
          <span>⌨️</span>
          <kbd style={styles.kbd}>Ctrl K</kbd>
        </button>
        <ThemeToggle />
      </div>
      {error && <div style={styles.error}>{error}</div>}
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: "var(--nav-bg, #24292e)",
    padding: "12px 24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    borderBottom: "1px solid var(--border, #30363d)",
    position: "sticky",
    top: 0,
    zIndex: 100
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap"
  },
  logo: {
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "20px",
    fontWeight: "700",
    whiteSpace: "nowrap"
  },
  navLink: {
    color: "#e1e4e8",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    padding: "6px 12px",
    borderRadius: "6px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transition: "background 0.2s",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center"
  },
  counter: {
    backgroundColor: "#f4a900",
    color: "#000000",
    borderRadius: "10px",
    padding: "1px 6px",
    fontSize: "11px",
    fontWeight: "700",
    marginLeft: "6px"
  },
  form: {
    display: "flex",
    gap: "8px",
    flex: 1,
    minWidth: "280px"
  },
  input: {
    flex: 1,
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #444",
    backgroundColor: "#3a3a4a",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none"
  },
  btn: {
    padding: "8px 16px",
    backgroundColor: "#0366d6",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    whiteSpace: "nowrap"
  },
  paletteBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "#e1e4e8",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "background 0.2s"
  },
  kbd: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "4px",
    padding: "1px 5px",
    fontSize: "10px",
    fontFamily: "monospace"
  },
  error: {
    color: "#ff6b6b",
    fontSize: "13px",
    textAlign: "center",
    marginTop: "6px"
  }
};

export default Navbar;