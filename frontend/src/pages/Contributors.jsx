import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getContributors } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import { formatNumber } from "../utils/helpers";

function Contributors() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getContributors(owner, repo)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Loading contributors..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

    if (!data || !Array.isArray(data.contributors) || data.contributors.length === 0) {
    if (!data?.dataAvailable) {
      return (
        <div>
          <div className="page-header">
            <h1 className="page-title">👥 Contributors</h1>
            <p className="page-subtitle">{owner}/{repo}</p>
          </div>
          <RepoNav />
          <div className="card" style={{ textAlign: "center", padding: "60px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
            <h3 style={{ marginBottom: "12px" }}>GitHub is computing stats</h3>
            <p style={{ color: "#586069", marginBottom: "24px" }}>
              GitHub needs a moment to calculate contributor statistics.
              Please wait 10–15 seconds and try again.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      );
    }
  }



  const busColor = { High: "#dc3545", Medium: "#ffc107", Low: "#28a745" };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👥 Contributors</h1>
        <p className="page-subtitle">{owner}/{repo} — Contributor analysis</p>
      </div>

      <RepoNav />

      <div className="grid-3" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{data.totalContributors}</div>
          <div className="stat-label">Total Contributors</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{formatNumber(data.totalContributions)}</div>
          <div className="stat-label">Total Contributions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value" style={{ color: busColor[data.busFactorRisk] }}>
            {data.busFactorRisk}
          </div>
          <div className="stat-label">Bus Factor Risk</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">🏆 Top Contributors</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Contributor</th>
                <th>Contributions</th>
                <th>Share</th>
                <th>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {(data.contributors || []).slice(0, 20).map((c, i) => (
                <tr key={c.login}>
                  <td style={{ color: "#586069", fontWeight: "600" }}>#{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img src={c.avatar} alt={c.login} style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                      <a href={c.url} target="_blank" rel="noreferrer" style={{ color: "#0366d6", fontWeight: "600", textDecoration: "none" }}>
                        {c.login}
                      </a>
                    </div>
                  </td>
                  <td><strong>{formatNumber(c.contributions)}</strong></td>
                  <td style={{ color: "#586069" }}>
                    {data.totalContributions > 0
                      ? `${((c.contributions / data.totalContributions) * 100).toFixed(1)}%`
                      : "0%"}
                  </td>
                  <td style={{ width: "180px" }}>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${data.totalContributions > 0 ? (c.contributions / data.totalContributions) * 100 : 0}%`,
                          backgroundColor: "#0366d6"
                        }}
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

export default Contributors;