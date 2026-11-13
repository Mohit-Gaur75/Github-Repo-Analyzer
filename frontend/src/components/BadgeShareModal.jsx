import { useState, useMemo } from "react";
import { getBadgeSvgUrl } from "../api/apiService";

const BADGES = [
  { id: "health", name: "Health Score", desc: "Overall composite health grade & percentage" },
  { id: "security", name: "Security & CVEs", desc: "Vulnerability & dependency advisory status" },
  { id: "bus-factor", name: "Bus Factor", desc: "Team key-person dependency & resilience score" },
  { id: "quality", name: "Code Quality", desc: "Passed engineering & documentation checks" },
  { id: "stars", name: "GitHub Stars", desc: "Total community stargazers count" }
];

function BadgeShareModal({ isOpen, onClose, owner, repo }) {
  const [style, setStyle] = useState("flat");
  const [format, setFormat] = useState("markdown"); // 'markdown' | 'html' | 'url'
  const [copiedId, setCopiedId] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const clientUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const analysisUrl = `${clientUrl}/dashboard/${owner}/${repo}`;
  const shareText = `Check out the comprehensive repository health & security analysis for ${owner}/${repo} on GitHub Analyzer!`;

  const badgeCodes = useMemo(() => {
    return BADGES.map((b) => {
      const imgUrl = getBadgeSvgUrl(owner, repo, b.id, style);
      let snippet = "";
      if (format === "markdown") {
        snippet = `[![${b.name}](${imgUrl})](${analysisUrl})`;
      } else if (format === "html") {
        snippet = `<a href="${analysisUrl}"><img src="${imgUrl}" alt="${b.name}" /></a>`;
      } else {
        snippet = imgUrl;
      }
      return {
        ...b,
        imgUrl,
        snippet
      };
    });
  }, [owner, repo, style, format, analysisUrl]);

  const handleCopy = (id, snippet) => {
    navigator.clipboard.writeText(snippet);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allMarkdown = badgeCodes
      .map((b) => `[![${b.name}](${b.imgUrl})](${analysisUrl})`)
      .join(" ");
    navigator.clipboard.writeText(allMarkdown);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(analysisUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 680,
          backgroundColor: "var(--bg-primary)",
          borderRadius: "14px",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "88vh",
          overflow: "hidden"
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: "18px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              🧾 README Badges & Share Card
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
              Embed dynamic SVG status badges in {owner}/{repo}&apos;s README or share analysis.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px 8px"
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Controls: Badge Style & Snippet Format */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 12, padding: "12px 16px",
            background: "var(--bg-tertiary)", borderRadius: 8
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Style:</span>
              {["flat", "flat-square"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  style={{
                    padding: "3px 10px", borderRadius: 14, fontSize: 12,
                    border: style === s ? "1px solid var(--primary)" : "1px solid var(--border)",
                    background: style === s ? "var(--primary)" : "var(--bg-primary)",
                    color: style === s ? "#fff" : "var(--text-secondary)",
                    cursor: "pointer", fontWeight: 600
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Format:</span>
              {[
                { id: "markdown", label: "Markdown" },
                { id: "html", label: "HTML" },
                { id: "url", label: "Image URL" }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setFormat(fmt.id)}
                  style={{
                    padding: "3px 10px", borderRadius: 14, fontSize: 12,
                    border: format === fmt.id ? "1px solid var(--primary)" : "1px solid var(--border)",
                    background: format === fmt.id ? "var(--primary)" : "var(--bg-primary)",
                    color: format === fmt.id ? "#fff" : "var(--text-secondary)",
                    cursor: "pointer", fontWeight: 600
                  }}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Badges List with Live Preview and Copy */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {badgeCodes.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: 8,
                  border: "1px solid var(--border)", background: "var(--bg-primary)",
                  flexWrap: "wrap", gap: 12
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 220 }}>
                  <img
                    src={b.imgUrl}
                    alt={b.name}
                    style={{ height: 20, display: "block" }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {b.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {b.desc}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end", minWidth: 240 }}>
                  <code style={{
                    fontSize: 11, padding: "4px 8px", borderRadius: 4,
                    background: "var(--bg-tertiary)", color: "var(--text-secondary)",
                    maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>
                    {b.snippet}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(b.id, b.snippet)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "4px 10px", fontSize: 12, whiteSpace: "nowrap" }}
                  >
                    {copiedId === b.id ? "✓ Copied" : "📋 Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Copy All Row */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleCopyAll}
              className="btn btn-primary btn-sm"
            >
              {copiedAll ? "✓ All Badges Copied!" : "📋 Copy All Badges (Markdown)"}
            </button>
          </div>

          {/* Social Share Section */}
          <div style={{
            borderTop: "1px solid var(--border)", paddingTop: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 12
          }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                📢 Share Analysis:
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>
                Spread the word about {owner}/{repo}&apos;s code health
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(analysisUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: "none" }}
              >
                𝕏 / Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(analysisUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: "none" }}
              >
                LinkedIn
              </a>
              <a
                href={`https://reddit.com/submit?url=${encodeURIComponent(analysisUrl)}&title=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: "none" }}
              >
                Reddit
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn btn-secondary btn-sm"
              >
                {copiedLink ? "✓ Link Copied" : "🔗 Copy Link"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BadgeShareModal;
