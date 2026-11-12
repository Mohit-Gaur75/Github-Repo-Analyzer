/**
 * Watchlist Service
 * Handles server-side watchlist management with in-memory store and optional database persistence.
 */

// In-memory watchlist store (keyed by lowercase "owner/repo")
const memoryWatchlist = new Map();

/**
 * Get all watchlisted repositories
 */
exports.getAllWatchlist = async () => {
  return Array.from(memoryWatchlist.values()).sort(
    (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
  );
};

/**
 * Add or update a repository in watchlist
 */
exports.addRepoToWatchlist = async ({ owner, repo, note = "", metadata = {} }) => {
  if (!owner || !repo) {
    throw new Error("Owner and repo are required");
  }

  const fullName = `${owner}/${repo}`;
  const key = fullName.toLowerCase();

  const item = {
    owner,
    repo,
    fullName,
    note: note.trim(),
    stars: metadata.stars || 0,
    forks: metadata.forks || 0,
    language: metadata.language || null,
    description: metadata.description || null,
    addedAt: memoryWatchlist.get(key)?.addedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  memoryWatchlist.set(key, item);
  return item;
};

/**
 * Remove repository from watchlist
 */
exports.removeRepoFromWatchlist = async (owner, repo) => {
  const key = `${owner}/${repo}`.toLowerCase();
  const existed = memoryWatchlist.delete(key);
  return { removed: existed, fullName: `${owner}/${repo}` };
};

/**
 * Check if a repository is in the watchlist
 */
exports.isRepoWatchlisted = async (owner, repo) => {
  const key = `${owner}/${repo}`.toLowerCase();
  return memoryWatchlist.has(key);
};

/**
 * Clear entire watchlist
 */
exports.clearAllWatchlist = async () => {
  const count = memoryWatchlist.size;
  memoryWatchlist.clear();
  return { clearedCount: count };
};
