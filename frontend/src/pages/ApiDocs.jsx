import { useState, useEffect, useMemo, useCallback } from "react";
import { getApiDocsSpec, generateDemoApiKey } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import axios from "axios";

export default function ApiDocs() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sandbox API Key state
  const [apiKey, setApiKey] = useState(localStorage.getItem("gra_api_key") || "");
  const [keyInfo, setKeyInfo] = useState(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Filter & Search state
  const [selectedTag, setSelectedTag] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEndpoint, setExpandedEndpoint] = useState(null);

  // Playground execution state
  const [testParams, setTestParams] = useState({ owner: "facebook", repo: "react", metric: "quality" });
  const [executing, setExecuting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [codeLang, setCodeLang] = useState("curl"); // "curl", "js", "python"
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const fetchSpec = useCallback(() => {
    setLoading(true);
    getApiDocsSpec()
      .then((res) => setSpec(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSpec();
  }, [fetchSpec]);

  const handleGenerateKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await generateDemoApiKey();
      if (res.success && res.apiKey) {
        setApiKey(res.apiKey);
        setKeyInfo(res);
        localStorage.setItem("gra_api_key", res.apiKey);
      }
    } catch (err) {
      alert("Failed to generate demo key: " + err.message);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Extract endpoints list from OpenAPI spec
  const endpoints = useMemo(() => {
    if (!spec?.paths) return [];
    const list = [];
    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, def]) => {
        list.push({
          path,
          method: method.toUpperCase(),
          summary: def.summary || "",
          tags: def.tags || [],
          parameters: def.parameters || [],
          responses: def.responses || {}
        });
      });
    });
    return list;
  }, [spec]);

  // Unique tags
  const tags = useMemo(() => {
    const set = new Set();
    endpoints.forEach((ep) => ep.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [endpoints]);

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      if (selectedTag !== "all" && !ep.tags.includes(selectedTag)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPath = ep.path.toLowerCase().includes(q);
        const matchSummary = ep.summary.toLowerCase().includes(q);
        const matchTag = ep.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchPath && !matchSummary && !matchTag) return false;
      }
      return true;
    });
  }, [endpoints, selectedTag, searchQuery]);

  // Execute test request in playground
  const handleExecuteRequest = async (ep) => {
    setExecuting(true);
    setTestResult(null);

    let actualPath = ep.path;
    actualPath = actualPath.replace("{owner}", testParams.owner || "facebook");
    actualPath = actualPath.replace("{repo}", testParams.repo || "react");
    actualPath = actualPath.replace("{metric}", testParams.metric || "quality");
    actualPath = actualPath.replace("{org}", testParams.owner || "facebook");
    actualPath = actualPath.replace("{username}", testParams.owner || "gaearon");

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
    const fullUrl = `${baseUrl}${actualPath}`;

    const startTime = performance.now();
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (apiKey) {
        headers["X-API-Key"] = apiKey;
      }

      const res = await axios.get(fullUrl, { headers, timeout: 15000 });
      const durationMs = Math.round(performance.now() - startTime);

      setTestResult({
        status: res.status,
        statusText: res.statusText || "OK",
        durationMs,
        headers: res.headers,
        data: res.data
      });
    } catch (err) {
      const durationMs = Math.round(performance.now() - startTime);
      setTestResult({
        status: err.response?.status || 500,
        statusText: err.response?.statusText || "Error",
        durationMs,
        headers: err.response?.headers || {},
        error: err.response?.data || err.message
      });
    } finally {
      setExecuting(false);
    }
  };

  // Generate code snippet
  const generateSnippet = (ep, lang) => {
    let actualPath = ep.path;
    actualPath = actualPath.replace("{owner}", testParams.owner || "facebook");
    actualPath = actualPath.replace("{repo}", testParams.repo || "react");
    actualPath = actualPath.replace("{metric}", testParams.metric || "quality");
    actualPath = actualPath.replace("{org}", testParams.owner || "facebook");
    actualPath = actualPath.replace("{username}", testParams.owner || "gaearon");

    const baseUrl = "http://localhost:5001/api";
    const fullUrl = `${baseUrl}${actualPath}`;
    const headerStr = apiKey ? ` -H "X-API-Key: ${apiKey}"` : "";

    if (lang === "curl") {
      return `curl -X GET "${fullUrl}" \\\n  -H "Accept: application/json"${headerStr ? ` \\\n ${headerStr}` : ""}`;
    }

    if (lang === "js") {
      return `// JavaScript (Fetch)
const response = await fetch("${fullUrl}", {
  headers: {
    "Accept": "application/json"${apiKey ? `,\n    "X-API-Key": "${apiKey}"` : ""}
  }
});
const data = await response.json();
console.log(data);`;
    }

    if (lang === "python") {
      return `# Python (requests)
import requests

url = "${fullUrl}"
headers = {
    "Accept": "application/json"${apiKey ? `,\n    "X-API-Key": "${apiKey}"` : ""}
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`;
    }

    return "";
  };

  const handleCopySnippet = (snippet) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  if (loading) return <LoadingSpinner message="Loading OpenAPI 3.0 documentation & playground..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      {/* Header Banner */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title">🔌 Public Developer REST API</h1>
          <p className="page-subtitle">
            OpenAPI 3.0.3 specification, live playground, dynamic SVG badges, and multi-language code generators
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <a
            href="http://localhost:5001/api/docs"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: "13px" }}
          >
            📑 Swagger UI View
          </a>
          <a
            href="http://localhost:5001/api/docs/spec"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
            style={{ fontSize: "13px" }}
          >
            📄 OpenAPI JSON Spec
          </a>
        </div>
      </div>

      {/* Sandbox Key Management & Rate Limit Card */}
      <div className="grid-2" style={{ marginBottom: "24px" }}>
        {/* API Key Card */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              🔑 Sandbox API Key
            </h3>
            {apiKey && (
              <span className="badge badge-success" style={{ fontSize: "11px" }}>
                Active Sandbox Key
              </span>
            )}
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary, #586069)", marginBottom: "16px" }}>
            Generate an ephemeral 24-hour sandbox API key to test authenticated requests and increase rate limits.
          </p>

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input
              type="text"
              readOnly
              value={apiKey || "No key generated yet"}
              placeholder="Click generate to create a sandbox key..."
              className="input"
              style={{ fontFamily: "monospace", fontSize: "13px", flex: 1 }}
            />
            {apiKey && (
              <button
                className="btn btn-secondary"
                onClick={handleCopyKey}
                style={{ padding: "6px 12px", fontSize: "13px" }}
              >
                {copiedKey ? "✅ Copied" : "📋 Copy"}
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handleGenerateKey}
              disabled={generatingKey}
              style={{ padding: "6px 14px", fontSize: "13px", whiteSpace: "nowrap" }}
            >
              {generatingKey ? "⏳ Generating..." : apiKey ? "🔄 New Key" : "✨ Generate Key"}
            </button>
          </div>

          {keyInfo && (
            <div style={{ fontSize: "12px", color: "var(--text-secondary, #586069)" }}>
              Quota: <strong>{keyInfo.rateLimit}</strong> | Expires: {new Date(keyInfo.expiresAt).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Rate Limiting & Authentication Guide */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: "12px" }}>
            ⚡ Rate Limits &amp; Headers
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary, #586069)", marginBottom: "12px" }}>
            All API endpoints return standard RFC rate limiting headers on every response:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontFamily: "monospace" }}>
            <div style={{ padding: "6px 10px", backgroundColor: "var(--bg-secondary, #f6f8fa)", borderRadius: "4px" }}>
              <strong>X-RateLimit-Limit:</strong> 100 requests per 15-minute window
            </div>
            <div style={{ padding: "6px 10px", backgroundColor: "var(--bg-secondary, #f6f8fa)", borderRadius: "4px" }}>
              <strong>X-RateLimit-Remaining:</strong> Remaining requests before HTTP 429
            </div>
            <div style={{ padding: "6px 10px", backgroundColor: "var(--bg-secondary, #f6f8fa)", borderRadius: "4px" }}>
              <strong>X-RateLimit-Reset:</strong> Epoch timestamp (seconds) when quota resets
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          {/* Tag Pills */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              className={`btn ${selectedTag === "all" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "4px 10px", fontSize: "12px" }}
              onClick={() => setSelectedTag("all")}
            >
              All ({endpoints.length})
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                className={`btn ${selectedTag === tag ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Search box */}
          <input
            type="text"
            placeholder="Search endpoint path, summary, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ width: "260px", padding: "6px 12px", fontSize: "13px" }}
          />
        </div>
      </div>

      {/* Endpoints Accordion List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
        {filteredEndpoints.map((ep, idx) => {
          const isExpanded = expandedEndpoint === ep.path;

          return (
            <div
              key={idx}
              className="card"
              style={{
                padding: "0",
                overflow: "hidden",
                border: isExpanded ? "1px solid var(--primary-color, #0969da)" : "1px solid var(--border-color, #e1e4e8)",
                transition: "border 0.2s"
              }}
            >
              {/* Header bar */}
              <div
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  backgroundColor: isExpanded ? "var(--bg-secondary, #f6f8fa)" : "transparent"
                }}
                onClick={() => {
                  setExpandedEndpoint(isExpanded ? null : ep.path);
                  setTestResult(null);
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      backgroundColor: ep.method === "GET" ? "#0969da" : "#2da44e",
                      color: "#ffffff"
                    }}
                  >
                    {ep.method}
                  </span>
                  <span style={{ fontFamily: "monospace", fontWeight: "600", fontSize: "14px" }}>
                    /api{ep.path}
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary, #586069)" }}>
                    {ep.summary}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {ep.tags.map((t) => (
                    <span key={t} className="badge" style={{ fontSize: "10px", backgroundColor: "var(--bg-secondary, #f1f3f5)" }}>
                      {t}
                    </span>
                  ))}
                  <span style={{ fontSize: "12px", color: "var(--text-secondary, #656d76)" }}>
                    {isExpanded ? "▲ Hide" : "▼ Try it"}
                  </span>
                </div>
              </div>

              {/* Expanded Interactive Playground */}
              {isExpanded && (
                <div style={{ padding: "18px", borderTop: "1px solid var(--border-color, #e1e4e8)" }}>
                  {/* Parameter Controls */}
                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary, #586069)" }}>
                      Request Parameters
                    </h4>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      {ep.path.includes("{owner}") && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-secondary, #586069)" }}>owner</label>
                          <input
                            type="text"
                            value={testParams.owner}
                            onChange={(e) => setTestParams({ ...testParams, owner: e.target.value })}
                            className="input"
                            style={{ width: "140px", padding: "4px 8px", fontSize: "12px" }}
                          />
                        </div>
                      )}
                      {ep.path.includes("{repo}") && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-secondary, #586069)" }}>repo</label>
                          <input
                            type="text"
                            value={testParams.repo}
                            onChange={(e) => setTestParams({ ...testParams, repo: e.target.value })}
                            className="input"
                            style={{ width: "140px", padding: "4px 8px", fontSize: "12px" }}
                          />
                        </div>
                      )}
                      {ep.path.includes("{metric}") && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-secondary, #586069)" }}>metric</label>
                          <select
                            value={testParams.metric}
                            onChange={(e) => setTestParams({ ...testParams, metric: e.target.value })}
                            className="input"
                            style={{ width: "130px", padding: "4px 8px", fontSize: "12px" }}
                          >
                            <option value="quality">quality</option>
                            <option value="health">health</option>
                            <option value="busfactor">busfactor</option>
                            <option value="complexity">complexity</option>
                            <option value="license">license</option>
                          </select>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleExecuteRequest(ep)}
                          disabled={executing}
                          style={{ padding: "6px 16px", fontSize: "12px", height: "30px" }}
                        >
                          {executing ? "🚀 Sending..." : "🚀 Execute Request"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Code Snippets Box */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className={`btn ${codeLang === "curl" ? "btn-primary" : "btn-secondary"}`}
                          style={{ padding: "2px 8px", fontSize: "11px" }}
                          onClick={() => setCodeLang("curl")}
                        >
                          cURL
                        </button>
                        <button
                          className={`btn ${codeLang === "js" ? "btn-primary" : "btn-secondary"}`}
                          style={{ padding: "2px 8px", fontSize: "11px" }}
                          onClick={() => setCodeLang("js")}
                        >
                          JavaScript
                        </button>
                        <button
                          className={`btn ${codeLang === "python" ? "btn-primary" : "btn-secondary"}`}
                          style={{ padding: "2px 8px", fontSize: "11px" }}
                          onClick={() => setCodeLang("python")}
                        >
                          Python
                        </button>
                      </div>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "2px 8px", fontSize: "11px" }}
                        onClick={() => handleCopySnippet(generateSnippet(ep, codeLang))}
                      >
                        {copiedSnippet ? "✅ Copied" : "📋 Copy Code"}
                      </button>
                    </div>

                    <pre
                      style={{
                        padding: "12px",
                        borderRadius: "6px",
                        backgroundColor: "var(--bg-secondary, #1f2428)",
                        color: "#f6f8fa",
                        fontSize: "12px",
                        overflowX: "auto",
                        lineHeight: "1.4",
                        margin: 0
                      }}
                    >
                      {generateSnippet(ep, codeLang)}
                    </pre>
                  </div>

                  {/* Test Response Window */}
                  {testResult && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            className={`badge ${testResult.status >= 200 && testResult.status < 300 ? "badge-success" : "badge-danger"}`}
                            style={{ fontSize: "12px" }}
                          >
                            Status: {testResult.status} {testResult.statusText}
                          </span>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary, #586069)" }}>
                            ⏱️ {testResult.durationMs} ms
                          </span>
                        </div>
                      </div>

                      <pre
                        style={{
                          padding: "14px",
                          borderRadius: "6px",
                          backgroundColor: "var(--bg-secondary, #f6f8fa)",
                          border: "1px solid var(--border-color, #e1e4e8)",
                          fontSize: "12px",
                          maxHeight: "350px",
                          overflowY: "auto",
                          lineHeight: "1.4",
                          margin: 0
                        }}
                      >
                        {JSON.stringify(testResult.data || testResult.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
