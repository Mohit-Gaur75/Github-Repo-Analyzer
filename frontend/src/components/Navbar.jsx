import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { parseGitHubUrl } from "../utils/helpers";

function Navbar() {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
      </div>
      {error && <div style={styles.error}>{error}</div>}
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: "#24292e",
    padding: "12px 24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
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
  error: {
    color: "#ff6b6b",
    fontSize: "13px",
    textAlign: "center",
    marginTop: "6px"
  }
};

export default Navbar;