import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { compareRepositories } from "../api/apiService";
import { parseGitHubUrl, formatNumber } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const PRESETS = [
  { label: "React vs Vue", r1: "facebook/react", r2: "vuejs/core" },
  { label: "Vite vs Webpack", r1: "vitejs/vite", r2: "webpack/webpack" },
  { label: "Express vs Fastify", r1: "expressjs/express", r2: "fastify/fastify" },
  { label: "Tailwind vs Bootstrap", r1: "tailwindlabs/tailwindcss", r2: "twbs/bootstrap" }
];

function Compare() {
  const { owner1, repo1, owner2, repo2 } = useParams();
  const navigate = useNavigate();

  const [input1, setInput1] = useState(owner1 && repo1 ? `${owner1}/${repo1}` : "facebook/react");
  const [input2, setInput2] = useState(owner2 && repo2 ? `${owner2}/${repo2}` : "vuejs/core");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(owner1 && repo1 && owner2 && repo2));
  const [error, setError] = useState("");

  const hasParams = Boolean(owner1 && repo1 && owner2 && repo2);

  useEffect(() => {
    if (owner1 && repo1 && owner2 && repo2) {
      setInput1(`${owner1}/${repo1}`);
      setInput2(`${owner2}/${repo2}`);
      setError("");

      compareRepositories(owner1, repo1, owner2, repo2)
        .then((res) => setData(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [owner1, repo1, owner2, repo2]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setError("");
    try {
      const parsed1 = parseGitHubUrl(input1);
      const parsed2 = parseGitHubUrl(input2);
      setLoading(true);
      navigate(`/compare/${parsed1.owner}/${parsed1.repo}/${parsed2.owner}/${parsed2.repo}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSwap = () => {
    const temp = input1;
    setInput1(input2);
    setInput2(temp);
    if (hasParams) {
      navigate(`/compare/${owner2}/${repo2}/${owner1}/${repo1}`);
    }
  };

  const handlePreset = (preset) => {
    setInput1(preset.r1);
    setInput2(preset.r2);
    const [o1, r1] = preset.r1.split("/");
    const [o2, r2] = preset.r2.split("/");
    setLoading(true);
    navigate(`/compare/${o1}/${r1}/${o2}/${r2}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ textAlign: "center", marginBottom: "28px" }}>
        <h1 className="page-title" style={{ fontSize: "28px", fontWeight: "800" }}>
          ⚔️ Repository Comparison
        </h1>
        <p className="page-subtitle">
          Compare any two GitHub repositories head-to-head across popularity, health, activity, and community.
        </p>
      </div>

      {/* Input Search Form */}
      <div className="card" style={{ marginBottom: "24px", padding: "20px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0366d6", marginBottom: "6px" }}>
              REPOSITORY 1
            </label>
            <input
              type="text"
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
              placeholder="owner/repo (e.g. facebook/react)"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "8px",
                border: "1px solid #ced4da", fontSize: "14px", outline: "none"
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleSwap}
            title="Swap repositories"
            className="btn btn-secondary"
            style={{ marginTop: "20px", padding: "10px 14px", fontSize: "16px" }}
          >
            ⇄
          </button>

          <div style={{ flex: 1, minWidth: "220px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#6f42c1", marginBottom: "6px" }}>
              REPOSITORY 2
            </label>
            <input
              type="text"
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
              placeholder="owner/repo (e.g. vuejs/core)"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "8px",
                border: "1px solid #ced4da", fontSize: "14px", outline: "none"
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "20px", padding: "11px 22px", fontWeight: "700" }}
          >
            ⚔️ Compare Now
          </button>
        </form>

        {/* Presets */}
        <div style={{ marginTop: "14px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "#586069", fontWeight: "600" }}>Popular comparisons:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePreset(p)}
              style={{
                background: "#f6f8fa", border: "1px solid #d1d5da",
                borderRadius: "16px", padding: "4px 12px", fontSize: "12px",
                cursor: "pointer", fontWeight: "500", color: "#24292e"
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => handleSubmit()} />}
      {loading && <LoadingSpinner message="Fetching comparison metrics for both repositories..." />}

      {/* Comparison Results */}
      {!loading && data && (
        <div>
          {/* Verdict Banner */}
          <div
            className="card"
            style={{
              marginBottom: "24px",
              background: data.tally.overallWinner === "repo1"
                ? "linear-gradient(135deg, #0366d6 0%, #1e40af 100%)"
                : data.tally.overallWinner === "repo2"
                ? "linear-gradient(135deg, #6f42c1 0%, #4c1d95 100%)"
                : "linear-gradient(135deg, #4b5563 0%, #1f2937 100%)",
              color: "#ffffff",
              padding: "20px 24px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <span style={{
                  background: "rgba(255,255,255,0.2)", padding: "4px 12px",
                  borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase"
                }}>
                  Verdict
                </span>
                <h2 style={{ fontSize: "22px", fontWeight: "800", marginTop: "8px" }}>
                  {data.tally.overallWinner === "repo1"
                    ? `🏆 ${data.repo1.fullName} leads in ${data.tally.repo1Wins} metrics`
                    : data.tally.overallWinner === "repo2"
                    ? `🏆 ${data.repo2.fullName} leads in ${data.tally.repo2Wins} metrics`
                    : "🤝 Both repositories are evenly matched!"}
                </h2>
                <p style={{ fontSize: "14px", opacity: 0.9, marginTop: "4px" }}>
                  {data.repo1.name} won {data.tally.repo1Wins} · {data.repo2.name} won {data.tally.repo2Wins} (out of {data.metrics.length} metrics)
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  className="btn"
                  onClick={() => navigate(`/dashboard/${data.repo1.owner.login}/${data.repo1.name}`)}
                  style={{ background: "#ffffff", color: "#0366d6", fontWeight: "700", fontSize: "13px" }}
                >
                  View {data.repo1.name} →
                </button>
                <button
                  className="btn"
                  onClick={() => navigate(`/dashboard/${data.repo2.owner.login}/${data.repo2.name}`)}
                  style={{ background: "#ffffff", color: "#6f42c1", fontWeight: "700", fontSize: "13px" }}
                >
                  View {data.repo2.name} →
                </button>
              </div>
            </div>
          </div>

          {/* Side-by-side Repo Cards */}
          <div className="grid-2" style={{ marginBottom: "24px" }}>
            {/* Repo 1 */}
            <div className="card" style={{ borderTop: "4px solid #0366d6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                <img
                  src={data.repo1.owner.avatar}
                  alt={data.repo1.owner.login}
                  style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid #e1e4e8" }}
                />
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>
                    <a href={data.repo1.url} target="_blank" rel="noreferrer" style={{ color: "#0366d6", textDecoration: "none" }}>
                      {data.repo1.fullName}
                    </a>
                  </h3>
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span className="badge badge-info">🌐 {data.repo1.primaryLanguage}</span>
                    <span className="badge badge-secondary">📄 {data.repo1.license}</span>
                    <span className="badge badge-success">❤️ Health: {data.repo1.healthScore}% ({data.repo1.healthGrade})</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "#586069", marginBottom: "12px", minHeight: "38px" }}>
                {data.repo1.description || "No description provided."}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#586069", borderTop: "1px solid #f0f0f0", paddingTop: "10px" }}>
                <span>Age: <strong>{data.repo1.ageFormatted}</strong></span>
                <span>CI/CD: <strong>{data.repo1.hasCICD ? "✅ Yes" : "❌ No"}</strong></span>
                <span>Size: <strong>{data.repo1.sizeMB} MB</strong></span>
              </div>
            </div>

            {/* Repo 2 */}
            <div className="card" style={{ borderTop: "4px solid #6f42c1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                <img
                  src={data.repo2.owner.avatar}
                  alt={data.repo2.owner.login}
                  style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid #e1e4e8" }}
                />
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>
                    <a href={data.repo2.url} target="_blank" rel="noreferrer" style={{ color: "#6f42c1", textDecoration: "none" }}>
                      {data.repo2.fullName}
                    </a>
                  </h3>
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span className="badge badge-info">🌐 {data.repo2.primaryLanguage}</span>
                    <span className="badge badge-secondary">📄 {data.repo2.license}</span>
                    <span className="badge badge-success">❤️ Health: {data.repo2.healthScore}% ({data.repo2.healthGrade})</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "#586069", marginBottom: "12px", minHeight: "38px" }}>
                {data.repo2.description || "No description provided."}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#586069", borderTop: "1px solid #f0f0f0", paddingTop: "10px" }}>
                <span>Age: <strong>{data.repo2.ageFormatted}</strong></span>
                <span>CI/CD: <strong>{data.repo2.hasCICD ? "✅ Yes" : "❌ No"}</strong></span>
                <span>Size: <strong>{data.repo2.sizeMB} MB</strong></span>
              </div>
            </div>
          </div>

          {/* Head-to-Head Comparison Table */}
          <div className="card" style={{ marginBottom: "24px", padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e1e4e8", backgroundColor: "#f8f9fa", display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>📊 Head-to-Head Metrics</h3>
              <span style={{ fontSize: "12px", color: "#586069" }}>
                ⭐ Blue = {data.repo1.name} · Purple = {data.repo2.name}
              </span>
            </div>

            <div className="table-container" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "35%", color: "#0366d6", fontSize: "14px", fontWeight: "700" }}>
                      {data.repo1.fullName}
                    </th>
                    <th style={{ width: "30%", textAlign: "center", fontSize: "13px" }}>Metric</th>
                    <th style={{ width: "35%", textAlign: "right", color: "#6f42c1", fontSize: "14px", fontWeight: "700" }}>
                      {data.repo2.fullName}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.metrics.map((m) => {
                    const isWinner1 = m.winner === "repo1";
                    const isWinner2 = m.winner === "repo2";

                    const displayVal1 = m.type === "number" ? formatNumber(m.val1) : m.type === "percentage" ? `${m.val1}%` : m.val1;
                    const displayVal2 = m.type === "number" ? formatNumber(m.val2) : m.type === "percentage" ? `${m.val2}%` : m.val2;

                    // Calculate ratio for visual balance bar
                    const num1 = typeof m.val1 === "number" ? m.val1 : 1;
                    const num2 = typeof m.val2 === "number" ? m.val2 : 1;
                    const total = num1 + num2 || 1;
                    const pct1 = Math.round((num1 / total) * 100);

                    return (
                      <tr key={m.key}>
                        {/* Repo 1 Value */}
                        <td style={{
                          fontWeight: isWinner1 ? "700" : "400",
                          backgroundColor: isWinner1 ? "rgba(3, 102, 214, 0.05)" : "transparent"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {isWinner1 && <span style={{ fontSize: "12px" }}>🏆</span>}
                            <span>{displayVal1}</span>
                          </div>
                        </td>

                        {/* Metric Label + Balance Bar */}
                        <td style={{ textAlign: "center", padding: "12px 10px" }}>
                          <div style={{ fontSize: "13px", fontWeight: "600", color: "#24292e", marginBottom: "4px" }}>
                            {m.label}
                          </div>
                          {typeof m.val1 === "number" && typeof m.val2 === "number" && (
                            <div style={{
                              display: "flex", width: "120px", height: "6px",
                              backgroundColor: "#e1e4e8", borderRadius: "3px",
                              margin: "0 auto", overflow: "hidden"
                            }}>
                              <div style={{ width: `${pct1}%`, backgroundColor: "#0366d6" }} />
                              <div style={{ width: `${100 - pct1}%`, backgroundColor: "#6f42c1" }} />
                            </div>
                          )}
                        </td>

                        {/* Repo 2 Value */}
                        <td style={{
                          textAlign: "right",
                          fontWeight: isWinner2 ? "700" : "400",
                          backgroundColor: isWinner2 ? "rgba(111, 66, 193, 0.05)" : "transparent"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                            <span>{displayVal2}</span>
                            {isWinner2 && <span style={{ fontSize: "12px" }}>🏆</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Languages Breakdown Comparison */}
          <div className="grid-2">
            <div className="card">
              <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "14px", color: "#0366d6" }}>
                🌐 {data.repo1.name} Top Languages
              </h4>
              {(data.repo1.languages || []).map((lang) => (
                <div key={lang.name} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <strong>{lang.name}</strong>
                    <span>{lang.percentage}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${lang.percentage}%`, backgroundColor: "#0366d6" }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "14px", color: "#6f42c1" }}>
                🌐 {data.repo2.name} Top Languages
              </h4>
              {(data.repo2.languages || []).map((lang) => (
                <div key={lang.name} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <strong>{lang.name}</strong>
                    <span>{lang.percentage}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${lang.percentage}%`, backgroundColor: "#6f42c1" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Compare;
