const { GoogleGenAI } = require("@google/genai");

// ─── Rule-based summary (fast, no API cost) ───────────────────────────────────
const generateSummary = (repoData, analysisData) => {
  const { name, description, stars, forks, language, createdAt } = repoData;
  const ageInYears = ((Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);

  return {
    overview: `${name} is a ${language || "multi-language"} repository with ${stars?.toLocaleString() || 0} stars and ${forks?.toLocaleString() || 0} forks. It has been active for ${ageInYears} years.`,
    activity:
      analysisData?.commits?.totalCommitsLastYear > 100
        ? "This is a highly active repository with frequent commits."
        : analysisData?.commits?.totalCommitsLastYear > 20
        ? "This repository shows moderate activity."
        : "This repository has low recent activity.",
    community:
      analysisData?.contributors?.totalContributors > 50
        ? "Large community with many contributors."
        : analysisData?.contributors?.totalContributors > 10
        ? "Medium-sized contributor community."
        : "Small contributor base — consider reaching out for contributors.",
    health:
      analysisData?.quality?.healthScore >= 80
        ? "The repository is in excellent health."
        : analysisData?.quality?.healthScore >= 60
        ? "The repository is in good health with some areas to improve."
        : "The repository needs attention in several areas.",
    description: description || "No description provided."
  };
};

// ─── Rule-based insights (fast, no API cost) ──────────────────────────────────
const generateInsights = (analysisData) => {
  const insights = [];

  if (analysisData?.commits?.averageCommitsPerWeek > 10) {
    insights.push({ type: "positive", title: "High Commit Frequency", message: `Averaging ${analysisData.commits.averageCommitsPerWeek} commits per week shows strong development activity.` });
  }
  if (analysisData?.issues?.closeRate > 80) {
    insights.push({ type: "positive", title: "Excellent Issue Resolution", message: `${analysisData.issues.closeRate}% of issues are resolved — great maintainer responsiveness.` });
  }
  if (analysisData?.prs?.mergeRate > 70) {
    insights.push({ type: "positive", title: "High PR Merge Rate", message: `${analysisData.prs.mergeRate}% of pull requests are merged — contributors are well-guided.` });
  }
  if (analysisData?.contributors?.busFactorRisk === "High") {
    insights.push({ type: "warning", title: "Bus Factor Risk", message: "Very few contributors — the project may be at risk if key maintainers leave." });
  }
  if (analysisData?.security?.securityScore < 50) {
    insights.push({ type: "warning", title: "Security Improvements Needed", message: "Several security best practices are missing. Review the security recommendations." });
  }
  if (analysisData?.quality?.qualityScore < 50) {
    insights.push({ type: "warning", title: "Quality Improvements Needed", message: "Missing key documentation files. Consider adding README, LICENSE, and CONTRIBUTING guides." });
  }

  return insights;
};

// ─── Gemini AI: deep analysis ─────────────────────────────────────────────────
const generateAIAnalysis = async (repoData, fullAnalysis) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });

  const {
    full_name, description, stargazers_count, forks_count,
    language, created_at, updated_at, open_issues_count, topics = [],
    license, visibility, has_wiki
  } = repoData;

  const ageInYears = ((Date.now() - new Date(created_at)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
  const languages = fullAnalysis?.languages || {};
  const topLanguages = Object.keys(languages).slice(0, 5).join(", ") || language || "Unknown";
  const contributors = fullAnalysis?.contributors || [];
  const totalContributors = contributors.length;
  const topContributors = contributors.slice(0, 3).map(c => c.login).join(", ") || "N/A";

  const prompt = `You are an expert open-source software analyst. Analyze this GitHub repository and provide structured, actionable insights.

## Repository Data
- **Name**: ${full_name}
- **Description**: ${description || "No description provided"}
- **Primary Language**: ${language || "Unknown"}
- **All Languages**: ${topLanguages}
- **Stars**: ${stargazers_count?.toLocaleString()}
- **Forks**: ${forks_count?.toLocaleString()}
- **Open Issues**: ${open_issues_count}
- **Age**: ${ageInYears} years old
- **Last Updated**: ${new Date(updated_at).toLocaleDateString()}
- **License**: ${license?.name || "No license"}
- **Topics**: ${topics.join(", ") || "None"}
- **Total Contributors**: ${totalContributors}
- **Top Contributors**: ${topContributors}
- **Visibility**: ${visibility}
- **Has Wiki**: ${has_wiki}

## Instructions
Return a JSON object with EXACTLY this structure (no markdown, just raw JSON):
{
  "summary": "2-3 sentence plain-English explanation of what this repo is and what it does",
  "purpose": "One sentence: who would use this and why",
  "techStack": ["list", "of", "key", "technologies", "detected"],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": [
    { "priority": "high|medium|low", "action": "specific actionable recommendation" }
  ],
  "targetAudience": "who this repo is for",
  "maturityLevel": "experimental|early-stage|growing|mature|stable|legacy",
  "overallScore": 75,
  "scoreBreakdown": {
    "activity": 80,
    "community": 70,
    "documentation": 60,
    "maintenance": 75
  },
  "funFact": "One interesting or surprising fact about this repository"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt
  });

  const text = response.text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("AI returned malformed JSON. Raw: " + text.slice(0, 200));
  }
};

module.exports = { generateSummary, generateInsights, generateAIAnalysis };
