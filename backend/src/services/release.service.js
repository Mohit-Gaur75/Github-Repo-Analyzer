const { githubRequestSafe } = require("../utils/githubApi");

/**
 * Categorize a version tag into semver types (major, minor, patch, prerelease)
 */
const classifySemver = (tag) => {
  if (!tag) return "other";
  const clean = tag.replace(/^v/i, "").trim();

  if (clean.includes("-") || clean.includes("rc") || clean.includes("beta") || clean.includes("alpha")) {
    return "prerelease";
  }

  const parts = clean.split(".");
  if (parts.length >= 3) {
    if (parts[1] === "0" && parts[2] === "0") return "major";
    if (parts[2] === "0") return "minor";
    return "patch";
  }
  return "other";
};

/**
 * Analyze repository releases, shipping cadence, and versioning patterns
 */
const getReleaseIntelligence = async (owner, repo) => {
  try {
    const [releasesRaw, tagsRaw] = await Promise.all([
      githubRequestSafe(`/repos/${owner}/${repo}/releases?per_page=50`),
      githubRequestSafe(`/repos/${owner}/${repo}/tags?per_page=50`)
    ]);

    const releases = Array.isArray(releasesRaw) ? releasesRaw : [];
    const tags = Array.isArray(tagsRaw) ? tagsRaw : [];

    // Semver counts
    const semverStats = { major: 0, minor: 0, patch: 0, prerelease: 0, other: 0 };
    const allTags = releases.length > 0
      ? releases.map((r) => r.tag_name)
      : tags.map((t) => t.name);

    allTags.forEach((tag) => {
      const type = classifySemver(tag);
      semverStats[type] = (semverStats[type] || 0) + 1;
    });

    // Format releases
    const formattedReleases = releases.map((r) => ({
      id: r.id,
      name: r.name || r.tag_name,
      tag: r.tag_name,
      publishedAt: r.published_at || r.created_at,
      author: {
        login: r.author?.login || "Unknown",
        avatar: r.author?.avatar_url || null,
        url: r.author?.html_url || null
      },
      isPrerelease: Boolean(r.prerelease),
      isDraft: Boolean(r.draft),
      htmlUrl: r.html_url,
      body: r.body ? r.body.slice(0, 500) : "",
      assetsCount: r.assets?.length || 0,
      downloadCount: (r.assets || []).reduce((acc, a) => acc + (a.download_count || 0), 0)
    }));

    const latest = formattedReleases[0] || (tags[0] ? {
      name: tags[0].name,
      tag: tags[0].name,
      publishedAt: null,
      isPrerelease: false,
      isDraft: false,
      htmlUrl: `https://github.com/${owner}/${repo}/releases/tag/${tags[0].name}`,
      body: "Tag release from Git history",
      assetsCount: 0,
      downloadCount: 0
    } : null);

    // Calculate Cadence (average days between releases)
    let avgDaysBetweenReleases = null;
    let cadenceLabel = "No Releases Tracked";
    let cadenceColor = "#6c757d";

    if (formattedReleases.length >= 2) {
      const intervals = [];
      for (let i = 0; i < formattedReleases.length - 1; i++) {
        const d1 = new Date(formattedReleases[i].publishedAt).getTime();
        const d2 = new Date(formattedReleases[i + 1].publishedAt).getTime();
        const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
        if (diffDays > 0) intervals.push(diffDays);
      }

      if (intervals.length > 0) {
        const total = intervals.reduce((a, b) => a + b, 0);
        avgDaysBetweenReleases = Math.round(total / intervals.length);

        if (avgDaysBetweenReleases <= 14) {
          cadenceLabel = `🔥 Rapid Shipping (~every ${avgDaysBetweenReleases} days)`;
          cadenceColor = "#28a745";
        } else if (avgDaysBetweenReleases <= 45) {
          cadenceLabel = `🚀 Regular Shipping (~every ${avgDaysBetweenReleases} days)`;
          cadenceColor = "#0366d6";
        } else if (avgDaysBetweenReleases <= 90) {
          cadenceLabel = `📅 Steady Shipping (~every ${avgDaysBetweenReleases} days)`;
          cadenceColor = "#f4a900";
        } else {
          cadenceLabel = `🐢 Infrequent Shipping (~every ${avgDaysBetweenReleases} days)`;
          cadenceColor = "#fd7e14";
        }
      }
    } else if (formattedReleases.length === 1) {
      cadenceLabel = "Initial Release Published";
      cadenceColor = "#0366d6";
    }

    return {
      repo: `${owner}/${repo}`,
      hasReleases: formattedReleases.length > 0,
      totalReleases: formattedReleases.length,
      totalTags: tags.length,
      latestRelease: latest,
      cadence: {
        avgDaysBetweenReleases,
        status: cadenceLabel,
        color: cadenceColor
      },
      semverStats,
      releases: formattedReleases.slice(0, 20),
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to fetch release intelligence: ${error.message}`);
  }
};

module.exports = { getReleaseIntelligence };
