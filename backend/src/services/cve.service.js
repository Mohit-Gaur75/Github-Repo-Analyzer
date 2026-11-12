const axios = require("axios");
const { githubRequestSafe } = require("../utils/githubApi");

const OSV_BATCH_URL = "https://api.osv.dev/v1/querybatch";

/**
 * Clean version string for OSV querying
 * e.g. "^1.2.3" -> "1.2.3", ">=2.0.0" -> "2.0.0", "~4.17.15" -> "4.17.15"
 */
const cleanVersion = (verStr) => {
  if (!verStr || typeof verStr !== "string") return null;
  const match = verStr.match(/(\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.]+)?)/);
  return match ? match[1] : null;
};

/**
 * Extract severity level (CRITICAL, HIGH, MEDIUM, LOW) from OSV vulnerability object
 */
const extractSeverity = (vuln) => {
  if (vuln.database_specific?.severity) {
    const s = vuln.database_specific.severity.toUpperCase();
    if (s.includes("CRIT")) return "CRITICAL";
    if (s.includes("HIGH")) return "HIGH";
    if (s.includes("MOD") || s.includes("MED")) return "MEDIUM";
    if (s.includes("LOW")) return "LOW";
  }

  // Check CVSS score if available
  if (Array.isArray(vuln.severity)) {
    for (const sev of vuln.severity) {
      if (sev.score && typeof sev.score === "string") {
        if (sev.score.includes("/S:C/") || sev.score.includes("/C:H/I:H/A:H")) return "HIGH";
      }
    }
  }

  // Check aliases/summary keywords
  const text = (vuln.summary || "" + vuln.details || "").toLowerCase();
  if (text.includes("remote code execution") || text.includes("command injection") || text.includes("sql injection")) {
    return "CRITICAL";
  }
  if (text.includes("prototype pollution") || text.includes("denial of service") || text.includes("cross-site")) {
    return "HIGH";
  }

  return "MEDIUM";
};

/**
 * Find fixed version from affected ranges
 */
const extractFixedVersion = (vuln) => {
  if (!Array.isArray(vuln.affected)) return null;
  for (const aff of vuln.affected) {
    if (Array.isArray(aff.ranges)) {
      for (const range of aff.ranges) {
        if (Array.isArray(range.events)) {
          for (const ev of range.events) {
            if (ev.fixed) return ev.fixed;
          }
        }
      }
    }
  }
  return null;
};

/**
 * Parse package.json content
 */
const parsePackageJson = (contentStr) => {
  try {
    const pkg = JSON.parse(contentStr);
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const queries = [];

    for (const [name, rawVer] of Object.entries(deps)) {
      const version = cleanVersion(rawVer);
      if (version && !name.startsWith("@types/")) {
        queries.push({
          name,
          version,
          rawVersion: rawVer,
          ecosystem: "npm"
        });
      }
    }
    return { manifestType: "package.json", ecosystem: "npm", queries };
  } catch {
    return null;
  }
};

/**
 * Parse requirements.txt content
 */
const parseRequirementsTxt = (contentStr) => {
  try {
    const lines = contentStr.split("\n");
    const queries = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const match = trimmed.match(/^([a-zA-Z0-9_.-]+)\s*([=><~]=?)\s*([0-9a-zA-Z_.-]+)/);
      if (match) {
        const name = match[1];
        const rawVer = match[3];
        const version = cleanVersion(rawVer);
        if (version) {
          queries.push({
            name,
            version,
            rawVersion: rawVer,
            ecosystem: "PyPI"
          });
        }
      }
    }
    return { manifestType: "requirements.txt", ecosystem: "PyPI", queries };
  } catch {
    return null;
  }
};

/**
 * Scan repository dependencies using OSV.dev
 */
const scanRepositoryCVEs = async (owner, repo) => {
  try {
    // 1. Try to fetch manifest files (package.json first, then requirements.txt)
    const [pkgJsonRaw, reqTxtRaw] = await Promise.all([
      githubRequestSafe(`/repos/${owner}/${repo}/contents/package.json`, {
        headers: { Accept: "application/vnd.github.v3.raw" }
      }),
      githubRequestSafe(`/repos/${owner}/${repo}/contents/requirements.txt`, {
        headers: { Accept: "application/vnd.github.v3.raw" }
      })
    ]);

    let parsed = null;
    if (pkgJsonRaw) {
      const content = typeof pkgJsonRaw === "string" ? pkgJsonRaw : JSON.stringify(pkgJsonRaw);
      parsed = parsePackageJson(content);
    }
    if (!parsed && reqTxtRaw && typeof reqTxtRaw === "string") {
      parsed = parseRequirementsTxt(reqTxtRaw);
    }

    if (!parsed || parsed.queries.length === 0) {
      return {
        hasManifest: false,
        message: "No supported manifest file (package.json or requirements.txt) found in repository root.",
        scannedCount: 0,
        vulnerabilities: [],
        vulnerablePackagesCount: 0,
        stats: { critical: 0, high: 0, medium: 0, low: 0 },
        cveScore: 100,
        grade: "A+"
      };
    }

    // Limit to 80 packages to keep requests fast
    const candidateList = parsed.queries.slice(0, 80);

    // 2. Query OSV.dev batch API
    const osvPayload = {
      queries: candidateList.map((item) => ({
        package: { name: item.name, ecosystem: item.ecosystem },
        version: item.version
      }))
    };

    const osvResponse = await axios.post(OSV_BATCH_URL, osvPayload, {
      timeout: 15000,
      headers: { "Content-Type": "application/json" }
    });

    const results = osvResponse.data?.results || [];
    const vulnerabilities = [];
    const vulnerablePkgSet = new Set();
    const stats = { critical: 0, high: 0, medium: 0, low: 0 };

    results.forEach((res, index) => {
      const pkg = candidateList[index];
      if (res.vulns && res.vulns.length > 0) {
        vulnerablePkgSet.add(pkg.name);

        res.vulns.forEach((v) => {
          const severity = extractSeverity(v);
          const fixedVersion = extractFixedVersion(v);
          const cveAlias = (v.aliases || []).find((a) => a.startsWith("CVE-")) || v.id;

          if (severity === "CRITICAL") stats.critical++;
          else if (severity === "HIGH") stats.high++;
          else if (severity === "MEDIUM") stats.medium++;
          else stats.low++;

          vulnerabilities.push({
            id: v.id,
            cve: cveAlias,
            packageName: pkg.name,
            ecosystem: pkg.ecosystem,
            installedVersion: pkg.rawVersion || pkg.version,
            severity,
            summary: v.summary || v.details?.slice(0, 150) || "Security vulnerability",
            fixedVersion: fixedVersion || "Upgrade to latest",
            advisoryUrl: `https://osv.dev/vulnerability/${v.id}`,
            publishedAt: v.published || null
          });
        });
      }
    });

    // Sort vulnerabilities: CRITICAL -> HIGH -> MEDIUM -> LOW
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    vulnerabilities.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Calculate CVE score deduction
    // Critical: -25, High: -15, Medium: -5, Low: -2
    const deduction = stats.critical * 25 + stats.high * 15 + stats.medium * 5 + stats.low * 2;
    const cveScore = Math.max(0, 100 - deduction);

    let grade = "A+";
    if (stats.critical > 0 || cveScore < 50) grade = "F";
    else if (stats.high > 0 || cveScore < 70) grade = "D";
    else if (stats.medium > 1 || cveScore < 85) grade = "C";
    else if (vulnerabilities.length > 0) grade = "B";

    return {
      hasManifest: true,
      manifestType: parsed.manifestType,
      ecosystem: parsed.ecosystem,
      scannedCount: candidateList.length,
      vulnerablePackagesCount: vulnerablePkgSet.size,
      vulnerabilities,
      stats,
      cveScore,
      grade,
      scannedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      hasManifest: false,
      error: error.message,
      scannedCount: 0,
      vulnerabilities: [],
      vulnerablePackagesCount: 0,
      stats: { critical: 0, high: 0, medium: 0, low: 0 },
      cveScore: 100,
      grade: "N/A"
    };
  }
};

module.exports = { scanRepositoryCVEs };
