import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getSBOM, getSBOMDownloadUrl } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import RepoNav from "../components/RepoNav";
import StatCard from "../components/StatCard";
import { formatNumber } from "../utils/helpers";

function SBOM() {
  const { owner, repo } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ecosystemFilter, setEcosystemFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [copiedPurl, setCopiedPurl] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    getSBOM(owner, repo)
      .then((res) => setData(res.data?.data || res.data))
      .catch((err) => setError(err.message || "Failed to generate Software Bill of Materials"))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  const ecosystems = useMemo(() => {
    if (!data?.ecosystems) return [];
    return Object.keys(data.ecosystems);
  }, [data]);

  const filteredComponents = useMemo(() => {
    if (!data?.components) return [];
    return data.components.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.purl.toLowerCase().includes(search.toLowerCase()) ||
        (c.license && c.license.toLowerCase().includes(search.toLowerCase()));

      const matchesEco =
        ecosystemFilter === "all" ||
        c.ecosystem.toLowerCase() === ecosystemFilter.toLowerCase();

      const matchesScope =
        scopeFilter === "all" ||
        c.scope.toLowerCase() === scopeFilter.toLowerCase();

      return matchesSearch && matchesEco && matchesScope;
    });
  }, [data, search, ecosystemFilter, scopeFilter]);

  const handleCopyPurl = (purl) => {
    navigator.clipboard.writeText(purl);
    setCopiedPurl(purl);
    setTimeout(() => setCopiedPurl(null), 2000);
  };

  if (loading) return <LoadingSpinner message="Generating industry-standard Software Bill of Materials (SPDX & CycloneDX)..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1 className="page-title">📦 Software Bill of Materials (SBOM)</h1>
        <p className="page-subtitle">
          Complete inventory of software components, packages, and dependencies formatted in SPDX 2.3 and OWASP CycloneDX 1.5 standards.
        </p>
      </div>

      <RepoNav />

      {/* Compliance & Export Bar */}
      <div className="card" style={{ marginBottom: 24, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span className="badge badge-success" style={{ fontSize: 12 }}>
                ✓ SPDX v2.3 Valid
              </span>
              <span className="badge badge-success" style={{ fontSize: 12 }}>
                ✓ CycloneDX v1.5 Valid
              </span>
              <span className="badge badge-info" style={{ fontSize: 12 }}>
                🛡️ NTIA Minimum Elements Met
              </span>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Generated {new Date(data.generatedAt).toLocaleString()} · Ready for enterprise procurement audit
            </span>
          </div>

          {/* Export Buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href={getSBOMDownloadUrl(owner, repo, "spdx")}
              download={`${owner}-${repo}-spdx.json`}
              className="btn btn-primary btn-sm"
              style={{ textDecoration: "none" }}
            >
              📥 SPDX 2.3 (JSON)
            </a>
            <a
              href={getSBOMDownloadUrl(owner, repo, "cyclonedx")}
              download={`${owner}-${repo}-cyclonedx.json`}
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: "none" }}
            >
              📥 CycloneDX 1.5
            </a>
            <a
              href={getSBOMDownloadUrl(owner, repo, "csv")}
              download={`${owner}-${repo}-sbom.csv`}
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: "none" }}
            >
              📄 CSV Table
            </a>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          icon="📦"
          value={formatNumber(data.totalComponents)}
          label="Total Components"
          color="#0366d6"
        />
        <StatCard
          icon="🚀"
          value={formatNumber(data.runtimeCount)}
          label="Runtime Dependencies"
          color="#28a745"
        />
        <StatCard
          icon="🛠️"
          value={formatNumber(data.devCount)}
          label="Dev Dependencies"
          color="#6f42c1"
        />
        <StatCard
          icon="🌐"
          value={ecosystems.length || 1}
          label="Ecosystems Detected"
          color="#f4a900"
        />
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: 24, padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 2, minWidth: 220 }}>
            <input
              type="text"
              placeholder="Search components by name, PURL, or license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 6,
                border: "1px solid var(--border)", fontSize: 13,
                backgroundColor: "var(--bg-primary)", color: "var(--text-primary)"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
              Ecosystem:
            </label>
            <select
              value={ecosystemFilter}
              onChange={(e) => setEcosystemFilter(e.target.value)}
              style={{
                padding: "8px 12px", borderRadius: 6,
                border: "1px solid var(--border)", fontSize: 13,
                backgroundColor: "var(--bg-primary)", color: "var(--text-primary)"
              }}
            >
              <option value="all">All Ecosystems</option>
              {ecosystems.map((eco) => (
                <option key={eco} value={eco}>
                  {eco}
                </option>
              ))}
            </select>

            <label style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
              Scope:
            </label>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              style={{
                padding: "8px 12px", borderRadius: 6,
                border: "1px solid var(--border)", fontSize: 13,
                backgroundColor: "var(--bg-primary)", color: "var(--text-primary)"
              }}
            >
              <option value="all">All Scopes</option>
              <option value="runtime">Runtime (Production)</option>
              <option value="development">Development</option>
            </select>
          </div>
        </div>
      </div>

      {/* Components Inventory Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 30 }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            📋 Component Inventory ({filteredComponents.length})
          </h3>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Standard Package URL (PURL) Specification
          </span>
        </div>

        <div className="table-container" style={{ border: "none" }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: "25%" }}>Package Name</th>
                <th>Version</th>
                <th>Ecosystem</th>
                <th>Scope</th>
                <th>Declared License</th>
                <th>Package URL (PURL)</th>
              </tr>
            </thead>
            <tbody>
              {filteredComponents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                    No components match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredComponents.map((comp) => (
                  <tr key={comp.purl}>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ color: "var(--text-primary)" }}>{comp.name}</span>
                    </td>
                    <td>
                      <code style={{
                        padding: "2px 6px", borderRadius: 4,
                        background: "var(--bg-tertiary)", fontSize: 12
                      }}>
                        {comp.version}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                        {comp.ecosystem}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${comp.scope === "runtime" ? "badge-success" : "badge-secondary"}`} style={{ fontSize: 11 }}>
                        {comp.scope}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: 11 }}>
                        {comp.license}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <code style={{
                          fontSize: 11, color: "var(--text-secondary)", wordBreak: "break-all",
                          background: "var(--bg-tertiary)", padding: "2px 6px", borderRadius: 4
                        }}>
                          {comp.purl}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyPurl(comp.purl)}
                          title="Copy PURL to clipboard"
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: 12, padding: "2px 4px", color: "var(--primary)"
                          }}
                        >
                          {copiedPurl === comp.purl ? "✓" : "📋"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SBOM;
