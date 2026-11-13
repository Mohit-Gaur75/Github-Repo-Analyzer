const activeDemoKeys = new Map();

const generateDemoApiKey = () => {
  const rand = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  const key = `gra_demo_${rand}`;
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours
  activeDemoKeys.set(key, { createdAt: now, expiresAt });
  return { key, expiresAt };
};

const isValidDemoKey = (key) => {
  if (!key || typeof key !== "string" || !key.startsWith("gra_demo_")) return false;
  const entry = activeDemoKeys.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    activeDemoKeys.delete(key);
    return false;
  }
  return true;
};

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "GitHub Repo Analyzer REST API",
    version: "2.0.0",
    description:
      "Production-grade public REST API for GitHub repository analytics, AI intelligence, security scanning, CI/CD observability, and SBOM generation.",
    contact: {
      name: "GitHub Repo Analyzer API Team",
      url: "https://github.com"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "http://localhost:5001/api",
      description: "Local Development Server"
    },
    {
      url: "/api",
      description: "Production / Current Host"
    }
  ],
  tags: [
    { name: "Repositories", description: "Repository details, overview, and metrics" },
    { name: "Languages & Stack", description: "Language distribution and detected technology stack" },
    { name: "Commits & Cadence", description: "Commit history, 52-week heatmap, and 24x7 punchcard" },
    { name: "Contributors", description: "Contributor analytics, Bus Factor, and Gini coefficient" },
    { name: "DevOps & CI/CD", description: "GitHub Actions workflows, build pass rates, and CI health" },
    { name: "Quality & Complexity", description: "Quality grading, file complexity, and churn hotspots" },
    { name: "Security & SBOM", description: "Vulnerability scanning, OSV CVEs, and SPDX/CycloneDX SBOM" },
    { name: "Releases & Velocity", description: "Release cadence, SemVer bumps, issues, and pull requests" },
    { name: "Badges", description: "Dynamic SVG Shields.io badges" },
    { name: "Developer Tools", description: "Developer profiles, organization portfolios, and repository comparison" }
  ],
  paths: {
    "/repo/{owner}/{repo}": {
      get: {
        tags: ["Repositories"],
        summary: "Get repository overview and health score",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" }
        ],
        responses: {
          200: { description: "Repository data and summary metrics" },
          404: { description: "Repository not found" }
        }
      }
    },
    "/languages/{owner}/{repo}": {
      get: {
        tags: ["Languages & Stack"],
        summary: "Get repository programming language breakdown",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" }
        ],
        responses: {
          200: { description: "Language distribution in bytes and percentages" }
        }
      }
    },
    "/techstack/{owner}/{repo}": {
      get: {
        tags: ["Languages & Stack"],
        summary: "Detect repository technology stack and architecture layers",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" }
        ],
        responses: {
          200: { description: "Detected frameworks, databases, libraries, and devops tools" }
        }
      }
    },
    "/commits/{owner}/{repo}": {
      get: {
        tags: ["Commits & Cadence"],
        summary: "Get commit history, weekly volume, and recent commits",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" }
        ],
        responses: {
          200: { description: "Commit metrics and recent commit stream" }
        }
      }
    },
    "/commits/{owner}/{repo}/calendar": {
      get: {
        tags: ["Commits & Cadence"],
        summary: "Get 52-week activity heatmap, streak analysis, and 24x7 punchcard matrix",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" }
        ],
        responses: {
          200: { description: "52-week calendar grid, streak stats, punch card matrix, and work cadence" }
        }
      }
    },
    "/contributors/{owner}/{repo}": {
      get: {
        tags: ["Contributors"],
        summary: "Get contributor leaderboard, Bus Factor score, and Gini inequality index",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" }
        ],
        responses: {
          200: { description: "Contributor breakdown, Bus Factor (65% threshold), and risk level" }
        }
      }
    },
    "/ci/{owner}/{repo}": {
      get: {
        tags: ["DevOps & CI/CD"],
        summary: "Get CI/CD workflows, build pass rates, and duration benchmarks",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" }
        ],
        responses: {
          200: { description: "GitHub Actions workflows, pass/failure rates, and recent run logs" }
        }
      }
    },
    "/complexity/{owner}/{repo}": {
      get: {
        tags: ["Quality & Complexity"],
        summary: "Get file complexity scores, churn hotspots, and refactoring priority map",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" }
        ],
        responses: {
          200: { description: "Complexity metrics, churn analysis, and high-risk hotspots" }
        }
      }
    },
    "/security/{owner}/{repo}": {
      get: {
        tags: ["Security & SBOM"],
        summary: "Get repository security posture, policies, and Dependabot status",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" }
        ],
        responses: {
          200: { description: "Security audit findings and score" }
        }
      }
    },
    "/security/{owner}/{repo}/cve": {
      get: {
        tags: ["Security & SBOM"],
        summary: "Perform deep OSV.dev CVE dependency vulnerability scan",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" }
        ],
        responses: {
          200: { description: "Vulnerability scan results from OSV.dev" }
        }
      }
    },
    "/sbom/{owner}/{repo}": {
      get: {
        tags: ["Security & SBOM"],
        summary: "Generate Software Bill of Materials (SPDX 2.3 or CycloneDX 1.5 JSON)",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" },
          { name: "format", in: "query", required: false, schema: { type: "string", enum: ["spdx", "cyclonedx"] }, example: "spdx" }
        ],
        responses: {
          200: { description: "Standard SBOM specification with Package URLs (purl)" }
        }
      }
    },
    "/releases/{owner}/{repo}": {
      get: {
        tags: ["Releases & Velocity"],
        summary: "Get release history, SemVer bump cadence, and version velocity",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" }
        ],
        responses: {
          200: { description: "Release stats and version frequency" }
        }
      }
    },
    "/quality/{owner}/{repo}": {
      get: {
        tags: ["Quality & Complexity"],
        summary: "Calculate repository quality score and community standards compliance",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" }
        ],
        responses: {
          200: { description: "Quality score and health checklist" }
        }
      }
    },
    "/badge/{owner}/{repo}/{metric}": {
      get: {
        tags: ["Badges"],
        summary: "Generate live dynamic SVG badge for README markdown embedding",
        parameters: [
          { name: "owner", in: "path", required: true, schema: { type: "string" }, example: "facebook" },
          { name: "repo", in: "path", required: true, schema: { type: "string" }, example: "react" },
          { name: "metric", in: "path", required: true, schema: { type: "string", enum: ["quality", "health", "busfactor", "complexity", "license", "stars", "ci"] }, example: "quality" }
        ],
        responses: {
          200: {
            description: "Dynamic SVG badge image",
            content: { "image/svg+xml": {} }
          }
        }
      }
    },
    "/org/{org}": {
      get: {
        tags: ["Developer Tools"],
        summary: "Aggregate analytics for all repositories in a GitHub organization",
        parameters: [
          { name: "org", in: "path", required: true, schema: { type: "string" }, example: "facebook" }
        ],
        responses: {
          200: { description: "Organization portfolio, aggregate metrics, and health leaderboard" }
        }
      }
    },
    "/discovery/trending": {
      get: {
        tags: ["Developer Tools"],
        summary: "Discover trending GitHub repositories with filters",
        parameters: [
          { name: "language", in: "query", required: false, schema: { type: "string" }, example: "javascript" },
          { name: "since", in: "query", required: false, schema: { type: "string", enum: ["daily", "weekly", "monthly"] }, example: "weekly" }
        ],
        responses: {
          200: { description: "List of trending repositories with metrics" }
        }
      }
    },
    "/user/{username}": {
      get: {
        tags: ["Developer Tools"],
        summary: "Analyze developer or maintainer contribution profile",
        parameters: [
          { name: "username", in: "path", required: true, schema: { type: "string" }, example: "gaearon" }
        ],
        responses: {
          200: { description: "Developer score, language breakdown, and public repositories" }
        }
      }
    },
    "/compare": {
      get: {
        tags: ["Developer Tools"],
        summary: "Compare two repositories side-by-side",
        parameters: [
          { name: "repo1", in: "query", required: true, schema: { type: "string" }, example: "facebook/react" },
          { name: "repo2", in: "query", required: true, schema: { type: "string" }, example: "vuejs/core" }
        ],
        responses: {
          200: { description: "Side-by-side comparison metrics and radar data" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "Optional API key for higher rate limits. Generate a sandbox key at /api/docs/keys/generate"
      }
    }
  }
};

const getSwaggerHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GitHub Repo Analyzer — Swagger API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://github.githubassets.com/favicons/favicon.png" />
  <style>
    body { margin: 0; padding: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .topbar { display: none !important; }
    .swagger-ui .info { margin: 24px 0; }
    .swagger-ui .info .title { font-size: 28px; }
    .custom-banner {
      background: #24292e;
      color: #ffffff;
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .custom-banner h1 { margin: 0; font-size: 18px; font-weight: 600; }
    .custom-banner a { color: #58a6ff; text-decoration: none; font-size: 14px; }
  </style>
</head>
<body>
  <div class="custom-banner">
    <h1>📊 GitHub Repo Analyzer — Developer API Documentation</h1>
    <div>
      <a href="/docs" target="_blank" style="margin-right: 16px;">🖥️ Web Console</a>
      <a href="/api/docs/spec" target="_blank">📄 OpenAPI JSON Spec</a>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/docs/spec',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;

module.exports = {
  openApiSpec,
  getSwaggerHtml,
  generateDemoApiKey,
  isValidDemoKey
};
