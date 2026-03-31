import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLanguages } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import { getLanguageColor, formatNumber } from "../utils/helpers";

function Languages() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getLanguages(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Analyzing languages..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🌐 Languages</h1>
        <p className="page-subtitle">{owner}/{repo} — Language breakdown</p>
      </div>

      <RepoNav />

      <div className="grid-3" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-value">{data.languageCount}</div>
          <div className="stat-label">Languages Used</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💾</div>
          <div className="stat-value">{formatNumber(data.totalBytes)}</div>
          <div className="stat-label">Total Bytes</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{data.formattedTotalLOC}</div>
          <div className="stat-label">Estimated Lines of Code</div>
        </div>
      </div>

      {/* Language bar */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 className="card-title">Language Distribution</h3>
        <div style={{ display: "flex", height: "24px", borderRadius: "12px", overflow: "hidden", marginBottom: "20px" }}>
          {data.languages.map((lang) => (
            <div
              key={lang.name}
              style={{
                width: `${lang.percentage}%`,
                backgroundColor: getLanguageColor(lang.name),
                transition: "width 0.5s ease"
              }}
              title={`${lang.name}: ${lang.percentage}%`}
            />
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {data.languages.map((lang) => (
            <div key={lang.name} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: getLanguageColor(lang.name) }} />
              <span style={{ fontSize: "13px" }}>{lang.name}</span>
              <span style={{ fontSize: "13px", color: "#586069" }}>{lang.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Language table */}
      <div className="card">
        <h3 className="card-title">Detailed Breakdown</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Language</th>
                <th>Percentage</th>
                <th>Bytes</th>
                <th>Est. Lines</th>
                <th>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {data.languages.map((lang) => (
                <tr key={lang.name}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: getLanguageColor(lang.name) }} />
                      <strong>{lang.name}</strong>
                    </div>
                  </td>
                  <td>{lang.percentage}%</td>
                  <td>{formatNumber(lang.bytes)}</td>
                  <td>{formatNumber(lang.estimatedLOC)}</td>
                  <td style={{ width: "200px" }}>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${lang.percentage}%`, backgroundColor: getLanguageColor(lang.name) }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Languages;