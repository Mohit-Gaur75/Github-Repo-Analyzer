import { useState, useEffect, useCallback } from "react";
import { WatchlistContext } from "./watchlistContext";

const STORAGE_KEY = "app_watchlist";

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    } catch {
      // ignore storage quota errors
    }
  }, [watchlist]);

  const isWatchlisted = useCallback(
    (fullName) => {
      if (!fullName) return false;
      return watchlist.some(
        (item) => item.fullName.toLowerCase() === fullName.toLowerCase()
      );
    },
    [watchlist]
  );

  const addToWatchlist = useCallback((repo, note = "") => {
    if (!repo || !repo.fullName) return;
    setWatchlist((prev) => {
      const exists = prev.some(
        (item) => item.fullName.toLowerCase() === repo.fullName.toLowerCase()
      );
      if (exists) return prev;

      const [owner, name] = repo.fullName.split("/");
      const entry = {
        owner: repo.owner?.login || repo.owner || owner,
        repo: repo.name || repo.repo || name,
        fullName: repo.fullName,
        description: repo.description || "",
        stars: Number(repo.stars || repo.stargazers_count || 0),
        forks: Number(repo.forks || repo.forks_count || 0),
        language: repo.language || "Unknown",
        note: note.trim(),
        addedAt: new Date().toISOString()
      };
      return [entry, ...prev];
    });
  }, []);

  const removeFromWatchlist = useCallback((fullName) => {
    if (!fullName) return;
    setWatchlist((prev) =>
      prev.filter(
        (item) => item.fullName.toLowerCase() !== fullName.toLowerCase()
      )
    );
  }, []);

  const toggleWatchlist = useCallback(
    (repo, note = "") => {
      if (!repo || !repo.fullName) return;
      if (isWatchlisted(repo.fullName)) {
        removeFromWatchlist(repo.fullName);
      } else {
        addToWatchlist(repo, note);
      }
    },
    [isWatchlisted, addToWatchlist, removeFromWatchlist]
  );

  const updateNote = useCallback((fullName, newNote) => {
    if (!fullName) return;
    setWatchlist((prev) =>
      prev.map((item) =>
        item.fullName.toLowerCase() === fullName.toLowerCase()
          ? { ...item, note: newNote }
          : item
      )
    );
  }, []);

  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
  }, []);

  const exportWatchlist = useCallback(() => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(watchlist, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `github-analyzer-watchlist-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [watchlist]);

  const importWatchlist = useCallback((importedItems) => {
    if (!Array.isArray(importedItems)) return 0;
    let addedCount = 0;
    setWatchlist((prev) => {
      const map = new Map();
      prev.forEach((item) => map.set(item.fullName.toLowerCase(), item));
      importedItems.forEach((item) => {
        if (item && item.fullName && !map.has(item.fullName.toLowerCase())) {
          map.set(item.fullName.toLowerCase(), {
            ...item,
            addedAt: item.addedAt || new Date().toISOString()
          });
          addedCount++;
        }
      });
      return Array.from(map.values());
    });
    return addedCount;
  }, []);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        count: watchlist.length,
        isWatchlisted,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlist,
        updateNote,
        clearWatchlist,
        exportWatchlist,
        importWatchlist
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}
