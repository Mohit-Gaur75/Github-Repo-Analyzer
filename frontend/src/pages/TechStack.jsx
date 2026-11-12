import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTechStack } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";

const LAYER_CONFIG = [
  { key: "frontend", title: "🖥️ Frontend Frameworks & Libraries", color: "#0366d6" },
  { key: "styling", title: "🎨 Styling & Design System", color: "#6f42c1" },
  { key: "backend", title: "⚙️ Backend, Server & APIs", color: "#28a745" },
  { key: "database", title: "🗄️ Database, ORM & Storage", color: "#fd7e14" },
  { key: "state", title: "🔄 State Management & Data Fetching", color: "#17a2b8" },
  { key: "build", title: "⚡ Build Tools, Compilers & Bundlers", color: "#f4a900" },
  { key: "testing", title: "🧪 Testing, Linting & QA", color: "#dc3545" },
  { key: "devops", title: "🐳 DevOps, Containers & CI/CD", color: "#24292e" },
  { key: "languages", title: "💻 Core Programming Languages", color: "#0366d6" }
];

function TechStack() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    getTechStack(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  const handleCopyBadges = () => {
    if (!data?.badges) return;
    const markdown = data.badges.map((b) => b.markdown).join(" ");
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (loading) return <LoadingSpinner message="Detecting repository tech stack & architecture blueprint..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  const layers = data.layers || {};

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🛠️ Tech Stack & Architecture</h1>
        <p className="page-subtitle">
          {owner}/{repo} — Automated multi-layer stack detection and architecture breakdown
        </p>
      </div>

      <RepoNav />

      {/* Architecture Hero Banner */}
      <div
        className="card"
        style={{
          marginBottom: "24px",
          background: "linear-gradient(135deg, #0366d6 0%, #1e40af 100%)",
          color: "#ffffff",
          padding: "24px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span style={{
              background: "rgba(255,255,255,0.2)", padding: "4px 12px",
              borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase"
            }}>
              Architecture Blueprint
            </span>
            <h2 style={{ fontSize: "24px", fontWeight: "800", marginTop: "8px", marginBottom: "6px" }}>
              {data.summary}
            </h2>
            <p style={{ fontSize: "14px", opacity: 0.9, margin: 0 }}>
              Classified as <strong>{data.archType}</strong> · {data.totalDetected} technologies identified
            </p>
          </div>

          <div style={{ textAlign: "right", background: "rgba(255,255,255,0.15)", padding: "12px 18px", borderRadius: "10px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800" }}>{data.totalDetected}</div>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>Detected Tools</div>
          </div>
        </div>
      </div>

      {/* README Badges Generator */}
      {data.badges?.length > 0 && (
        <div className="card" style={{ marginBottom: "24px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                🏷️ README Tech Stack Badges
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#586069" }}>
                Embed these shields.io badges into your GitHub README.md
              </p>
            </div>
            <button
              onClick={handleCopyBadges}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: "600" }}
            >
              {copied ? "✅ Copied Markdown!" : "📋 Copy Badges"}
            </button>
          </div>

          {/* Badges preview */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "10px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #e1e4e8" }}>
            {data.badges.map((b) => (
              <span
                key={b.name}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 10px",
                  backgroundColor: "#24292e",
                  color: "#ffffff",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}
              >
                {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Layered Stack Breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
        {LAYER_CONFIG.map((conf) => {
          const items = layers[conf.key] || [];
          if (items.length === 0) return null;

          return (
            <div key={conf.key} className="card" style={{ borderLeft: `4px solid ${conf.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#24292e" }}>
                  {conf.title}
                </h3>
                <span className="badge" style={{ backgroundColor: `${conf.color}15`, color: conf.color, fontWeight: "700" }}>
                  {items.length} {items.length === 1 ? "tool" : "tools"}
                </span>
              </div>

              <div className="grid-3" style={{ gap: "12px" }}>
                {items.map((tech) => (
                  <div
                    key={tech.name}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #e1e4e8"
                    }}
                  >
                    <span style={{ fontSize: "22px", flexShrink: 0, marginTop: "2px" }}>
                      {tech.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                        <strong style={{ fontSize: "14px", color: "#24292e" }}>{tech.name}</strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "#586069", marginTop: "2px", lineHeight: "1.4" }}>
                        {tech.role}
                      </div>
                      <div style={{ marginTop: "6px" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            backgroundColor: "#e1e4e8",
                            color: "#586069",
                            fontWeight: "500"
                          }}
                        >
                          Source: {tech.source}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TechStack;
