const { calculateHealthScore } = require("../utils/healthScore");
const { githubRequestSafe } = require("../utils/githubApi");
const { getQuality } = require("./quality.service");
const { scanRepositoryCVEs } = require("./cve.service");
const { calculateBusFactor } = require("./contributor.service");

/**
 * Approximate text width calculation for SVG rendering (Verdana 11px)
 */
function getTextWidth(text) {
  if (!text) return 0;
  // Approximate width per character in Verdana 11px
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/[ijlI1.,:;!|']/.test(ch)) width += 4;
    else if (/[frt]/.test(ch)) width += 5.5;
    else if (/[mwWMQ]/.test(ch)) width += 9.5;
    else if (/[A-Z]/.test(ch)) width += 7.5;
    else if (/[0-9]/.test(ch)) width += 6.5;
    else width += 6.5;
  }
  return Math.round(width) + 2;
}

/**
 * Generate Shields.io-compatible SVG Badge
 */
function renderSvgBadge({ label, value, color = "#0366d6", style = "flat" }) {
  const labelText = String(label).trim();
  const valueText = String(value).trim();

  const labelWidth = getTextWidth(labelText) + 12;
  const valueWidth = getTextWidth(valueText) + 12;
  const totalWidth = labelWidth + valueWidth;
  const height = 20;
  const radius = style === "flat-square" ? 0 : 3;

  const labelCenter = labelWidth / 2;
  const valueCenter = labelWidth + valueWidth / 2;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${labelText}: ${valueText}">
  <title>${labelText}: ${valueText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="${radius}" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${color}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${labelCenter * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth - 12) * 10}">${labelText}</text>
    <text x="${labelCenter * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(labelWidth - 12) * 10}">${labelText}</text>
    <text aria-hidden="true" x="${valueCenter * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(valueWidth - 12) * 10}">${valueText}</text>
    <text x="${valueCenter * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(valueWidth - 12) * 10}">${valueText}</text>
  </g>
</svg>`.trim();
}

/**
 * Format large numbers e.g. 228000 -> "228k"
 */
function formatK(num) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(num);
}

/**
 * Get SVG badge content for a specific metric
 */
exports.generateBadge = async (owner, repo, metric, style = "flat") => {
  const normMetric = (metric || "health").toLowerCase();

  switch (normMetric) {
    case "health": {
      const repoData = await githubRequestSafe(`/repos/${owner}/${repo}`);
      const health = calculateHealthScore(repoData || {});
      const grade = health.grade || "B";
      const score = health.score || 75;

      let color = "#28a745";
      if (grade === "A+" || grade === "A") color = "#28a745";
      else if (grade === "B") color = "#0366d6";
      else if (grade === "C") color = "#f4a900";
      else color = "#dc3545";

      return renderSvgBadge({
        label: "repo health",
        value: `${grade} (${score}%)`,
        color,
        style
      });
    }

    case "quality": {
      const quality = await getQuality(owner, repo);
      const score = quality?.qualityScore || 80;
      const color = score >= 80 ? "#28a745" : score >= 60 ? "#0366d6" : "#dc3545";

      return renderSvgBadge({
        label: "code quality",
        value: `${score}%`,
        color,
        style
      });
    }

    case "security": {
      const sec = await scanRepositoryCVEs(owner, repo);
      const totalVulns = sec.vulnerabilities?.length || 0;
      const label = "security";
      let value = `${totalVulns} CVEs`;
      let color = "#28a745";

      if (totalVulns === 0) {
        value = "passing";
        color = "#28a745";
      } else if (sec.stats?.critical > 0) {
        value = `${sec.stats.critical} critical`;
        color = "#dc3545";
      } else if (sec.stats?.high > 0) {
        value = `${sec.stats.high} high`;
        color = "#e65100";
      } else {
        color = "#f4a900";
      }

      return renderSvgBadge({
        label,
        value,
        color,
        style
      });
    }

    case "bus-factor": {
      const bus = await calculateBusFactor(owner, repo);
      const bf = bus.busFactor || 1;
      const color = bf >= 4 ? "#28a745" : bf >= 2 ? "#f4a900" : "#dc3545";

      return renderSvgBadge({
        label: "bus factor",
        value: `${bf} (${bus.riskLevel || "Moderate"})`,
        color,
        style
      });
    }

    case "stars": {
      const repoData = await githubRequestSafe(`/repos/${owner}/${repo}`);
      const stars = repoData?.stargazers_count || 0;

      return renderSvgBadge({
        label: "stars",
        value: `★ ${formatK(stars)}`,
        color: "#f4a900",
        style
      });
    }

    case "status": {
      return renderSvgBadge({
        label: "analyzer",
        value: "verified",
        color: "#28a745",
        style
      });
    }

    default: {
      return renderSvgBadge({
        label: "analyzer",
        value: "active",
        color: "#0366d6",
        style
      });
    }
  }
};

/**
 * Return list of all available badges with markdown/HTML snippets
 */
exports.getAllBadgeSnippets = (owner, repo, baseUrl = "http://localhost:5001", clientUrl = "http://localhost:5173") => {
  const metrics = [
    { id: "health", name: "Health Score", label: "repo health" },
    { id: "security", name: "Security & CVEs", label: "security" },
    { id: "bus-factor", name: "Bus Factor", label: "bus factor" },
    { id: "quality", name: "Quality Checks", label: "code quality" },
    { id: "stars", name: "GitHub Stars", label: "stars" }
  ];

  return metrics.map((m) => {
    const badgeUrl = `${baseUrl}/api/badge/${owner}/${repo}/${m.id}`;
    const linkUrl = `${clientUrl}/dashboard/${owner}/${repo}`;
    return {
      id: m.id,
      name: m.name,
      badgeUrl,
      linkUrl,
      markdown: `[![${m.name}](${badgeUrl})](${linkUrl})`,
      html: `<a href="${linkUrl}"><img src="${badgeUrl}" alt="${m.name}" /></a>`
    };
  });
};
