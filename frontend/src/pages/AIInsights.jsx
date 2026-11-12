import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAIInsights } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, label, size = 80 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? "#28a745" : score >= 50 ? "#f4a900" : "#dc3545";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e1e4e8" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          fontSize={size < 70 ? 13 : 16} fontWeight="700" fill={color}>
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 12, color: "#586069", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ─── Maturity Badge ───────────────────────────────────────────────────────────
const maturityColors = {
  experimental: "#6f42c1",
  "early-stage": "#fd7e14",
  growing: "#0366d6",
  mature: "#28a745",
  stable: "#17a2b8",
  legacy: "#6c757d"
};

function MaturityBadge({ level }) {
  return (
    <span style={{
      padding: "4px 14px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      color: "#fff",
      backgroundColor: maturityColors[level] || "#586069",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    }}>
      {level}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function AIInsights() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getAIInsights(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="🤖 Gemini AI is analyzing this repository…" />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  const priorityColor = { high: "#dc3545", medium: "#f4a900", low: "#28a745" };

  return (
    <div>
      <RepoNav />

      {/* Header */}
      <div className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>🤖 AI-Powered Insights</h2>
            <p style={{ opacity: 0.9, fontSize: 14, marginBottom: 10 }}>
              Powered by <strong>Gemini 2.0 Flash</strong> · {owner}/{repo}
            </p>
            <MaturityBadge level={data.maturityLevel} />
          </div>
          <ScoreRing score={data.overallScore} label="Overall" size={90} />
        </div>
      </div>

      {/* Summary + Purpose */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 className="card-title">📋 What is this repo?</h3>
          <p style={{ lineHeight: 1.7, color: "var(--text-primary)", marginBottom: 12 }}>{data.summary}</p>
          <div style={{ padding: "10px 14px", background: "var(--bg-tertiary)", borderRadius: 8, borderLeft: "3px solid var(--primary)" }}>
            <strong style={{ fontSize: 12, color: "var(--text-secondary)" }}>TARGET AUDIENCE</strong>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-primary)" }}>{data.targetAudience}</p>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">🛠 Tech Stack</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {(data.techStack || []).map((tech) => (
              <span key={tech} style={{
                padding: "4px 12px", borderRadius: 20,
                background: "var(--primary-light)", color: "var(--primary)",
                fontSize: 13, fontWeight: 600
              }}>{tech}</span>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}><strong>Purpose:</strong> {data.purpose}</p>
          {data.funFact && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--badge-warning-bg)", borderRadius: 8, borderLeft: "3px solid var(--warning)" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--badge-warning-text)" }}>💡 FUN FACT</span>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-primary)" }}>{data.funFact}</p>
            </div>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      {data.scoreBreakdown && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 className="card-title">📊 Score Breakdown</h3>
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 24, padding: "8px 0" }}>
            {Object.entries(data.scoreBreakdown).map(([key, val]) => (
              <ScoreRing key={key} score={val} label={key.charAt(0).toUpperCase() + key.slice(1)} size={80} />
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 className="card-title">✅ Strengths</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {(data.strengths || []).map((s, i) => (
              <li key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < data.strengths.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <span style={{ color: "#28a745", fontSize: 18 }}>✓</span>
                <span style={{ fontSize: 14, lineHeight: 1.5 }}>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 className="card-title">⚠️ Weaknesses</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {(data.weaknesses || []).map((w, i) => (
              <li key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < data.weaknesses.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <span style={{ color: "#dc3545", fontSize: 18 }}>✗</span>
                <span style={{ fontSize: 14, lineHeight: 1.5 }}>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 className="card-title">🎯 AI Recommendations</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.recommendations.map((rec, i) => (
              <div key={i} style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                padding: "12px 16px", borderRadius: 10,
                background: rec.priority === "high" ? "var(--badge-danger-bg)" : rec.priority === "medium" ? "var(--badge-warning-bg)" : "var(--badge-success-bg)",
                border: `1px solid ${priorityColor[rec.priority] || "var(--border)"}44`
              }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                  color: "#fff", background: priorityColor[rec.priority] || "#586069",
                  whiteSpace: "nowrap", alignSelf: "center"
                }}>
                  {rec.priority?.toUpperCase()}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)" }}>{rec.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", color: "#959da5", fontSize: 12, padding: "8px 0 20px" }}>
        Analysis generated by Gemini AI · {new Date(data.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}

export default AIInsights;
