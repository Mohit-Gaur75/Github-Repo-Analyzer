import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { parseGitHubUrl, formatNumber, timeAgo } from "../utils/helpers";
import { getRecentRepos } from "../api/apiService";

function Home() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [recentRepos, setRecentRepos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getRecentRepos()
      .then((res) => {
        // Interceptor returns response.data shape: { success, data: [...] }
        setRecentRepos(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {});
  }, []);

  const handleAnalyze = (e) => {
    e.preventDefault();
    setError("");
    try {
      const { owner, repo } = parseGitHubUrl(input);
      navigate(`/dashboard/${owner}/${repo}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.title}>📊 GitHub Repo Analyzer</h1>
        <p style={styles.subtitle}>
          Deep insights into any GitHub repository — languages, commits,
          contributors, issues, quality and security.
        </p>
        <form onSubmit={handleAnalyze} style={styles.form}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter repo: facebook/react or https://github.com/facebook/react"
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.btn}>
            🔍 Analyze Repository
          </button>
        </form>
        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.examples}>
          <span style={styles.examplesLabel}>Try these:</span>
          {["facebook/react", "microsoft/vscode", "torvalds/linux"].map(
            (example) => (
              <button
                key={example}
                style={styles.exampleBtn}
                onClick={() => {
                  const [owner, repo] = example.split("/");
                  navigate(`/dashboard/${owner}/${repo}`);
                }}
              >
                {example}
              </button>
            )
          )}
        </div>
      </div>

      {/* Features */}
      <div style={styles.features}>
        {[
          { icon: "🌐", title: "Languages", desc: "Language breakdown with LOC estimates" },
          { icon: "📝", title: "Commits", desc: "Weekly activity and commit trends" },
          { icon: "👥", title: "Contributors", desc: "Top contributors and bus factor" },
          { icon: "🐛", title: "Issues", desc: "Open/closed ratio and resolution time" },
          { icon: "🔀", title: "Pull Requests", desc: "Merge rate and PR activity" },
          { icon: "✅", title: "Quality", desc: "Docs, tests, CI/CD checks" },
          { icon: "🔒", title: "Security", desc: "Security policy and risk detection" },
          { icon: "💾", title: "History", desc: "Saved analysis with MongoDB" }
        ].map((f) => (
          <div key={f.title} style={styles.featureCard}>
            <div style={styles.featureIcon}>{f.icon}</div>
            <h3 style={styles.featureTitle}>{f.title}</h3>
            <p style={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Recent repos */}
      {recentRepos.length > 0 && (
        <div style={styles.recentSection}>
          <h2 style={styles.recentTitle}>🕐 Recently Analyzed</h2>
          <div style={styles.recentGrid}>
            {recentRepos.map((repo) => (
              <div
                key={repo.fullName}
                style={styles.recentCard}
                onClick={() => {
                  const [owner, name] = repo.fullName.split("/");
                  navigate(`/dashboard/${owner}/${name}`);
                }}
              >
                <div style={styles.recentName}>{repo.fullName}</div>
                <div style={styles.recentDesc}>
                  {repo.description?.substring(0, 60) || "No description"}
                  {repo.description?.length > 60 ? "..." : ""}
                </div>
                <div style={styles.recentMeta}>
                  <span>⭐ {formatNumber(repo.stars)}</span>
                  <span>🕐 {timeAgo(repo.lastAnalyzed)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: "900px", margin: "0 auto" },
  hero: {
    textAlign: "center",
    padding: "60px 20px 40px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "16px",
    marginBottom: "40px",
    color: "#fff"
  },
  title: { fontSize: "36px", fontWeight: "800", marginBottom: "12px" },
  subtitle: { fontSize: "16px", opacity: 0.9, marginBottom: "32px", maxWidth: "600px", margin: "0 auto 32px" },
  form: { display: "flex", gap: "10px", maxWidth: "680px", margin: "0 auto 16px", flexWrap: "wrap" },
  input: {
    flex: 1,
    minWidth: "280px",
    padding: "14px 18px",
    borderRadius: "8px",
    border: "none",
    fontSize: "15px",
    outline: "none"
  },
  btn: {
    padding: "14px 24px",
    backgroundColor: "#ff6b35",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  error: { color: "#ffcccc", fontSize: "14px", marginTop: "8px" },
  examples: { display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginTop: "16px" },
  examplesLabel: { fontSize: "13px", opacity: 0.8 },
  exampleBtn: {
    padding: "4px 12px",
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.4)",
    borderRadius: "20px",
    fontSize: "13px",
    cursor: "pointer"
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "40px"
  },
  featureCard: {
    background: "#fff",
    border: "1px solid #e1e4e8",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
  },
  featureIcon: { fontSize: "28px", marginBottom: "8px" },
  featureTitle: { fontSize: "15px", fontWeight: "600", marginBottom: "6px" },
  featureDesc: { fontSize: "13px", color: "#586069" },
  recentSection: { marginBottom: "40px" },
  recentTitle: { fontSize: "20px", fontWeight: "700", marginBottom: "16px" },
  recentGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" },
  recentCard: {
    background: "#fff",
    border: "1px solid #e1e4e8",
    borderRadius: "10px",
    padding: "16px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  recentName: { fontWeight: "700", fontSize: "14px", color: "#0366d6", marginBottom: "6px" },
  recentDesc: { fontSize: "13px", color: "#586069", marginBottom: "10px" },
  recentMeta: { display: "flex", gap: "12px", fontSize: "12px", color: "#959da5" }
};

export default Home;
