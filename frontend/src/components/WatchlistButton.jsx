import { useWatchlist } from "../context/watchlistContext";

function WatchlistButton({ repoData, size = "md" }) {
  const { isWatchlisted, toggleWatchlist } = useWatchlist();

  if (!repoData || !repoData.fullName) return null;

  const saved = isWatchlisted(repoData.fullName);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleWatchlist(repoData);
  };

  const isSmall = size === "sm";

  return (
    <button
      onClick={handleClick}
      type="button"
      title={saved ? "Remove from saved watchlist" : "Save to watchlist for quick access"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSmall ? "4px" : "8px",
        padding: isSmall ? "5px 10px" : "8px 16px",
        borderRadius: "20px",
        fontSize: isSmall ? "12px" : "13px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s ease",
        border: saved ? "1px solid #f4a900" : "1px solid var(--border)",
        background: saved
          ? "linear-gradient(135deg, rgba(244, 169, 0, 0.15), rgba(255, 193, 7, 0.25))"
          : "var(--bg-tertiary)",
        color: saved ? "#d29922" : "var(--text-primary)",
        boxShadow: saved ? "0 1px 4px rgba(244, 169, 0, 0.2)" : "none"
      }}
    >
      <span style={{ fontSize: isSmall ? "13px" : "15px" }}>
        {saved ? "⭐" : "☆"}
      </span>
      <span>{saved ? "Saved" : "Save Repo"}</span>
    </button>
  );
}

export default WatchlistButton;
