import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import CommandPalette from "./components/CommandPalette";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Languages from "./pages/Languages";
import Commits from "./pages/Commits";
import Contributors from "./pages/Contributors";
import Issues from "./pages/Issues";
import PullRequests from "./pages/PullRequests";
import Quality from "./pages/Quality";
import CIHealth from "./pages/CIHealth";
import Complexity from "./pages/Complexity";
import Security from "./pages/Security";
import SBOM from "./pages/SBOM";
import AIInsights from "./pages/AIInsights";
import Activity from "./pages/Activity";
import Trends from "./pages/Trends";
import TechStack from "./pages/TechStack";
import Releases from "./pages/Releases";
import Report from "./pages/Report";
import Compare from "./pages/Compare";
import DeveloperProfile from "./pages/DeveloperProfile";
import OrgDashboard from "./pages/OrgDashboard";
import Watchlist from "./pages/Watchlist";
import Discovery from "./pages/Discovery";
import NotFound from "./pages/NotFound";

function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="app">
      <Navbar onOpenPalette={() => setPaletteOpen(true)} />
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard/:owner/:repo"
            element={<Dashboard />}
          />
          <Route
            path="/languages/:owner/:repo"
            element={<Languages />}
          />
          <Route
            path="/techstack/:owner/:repo"
            element={<TechStack />}
          />
          <Route
            path="/commits/:owner/:repo"
            element={<Commits />}
          />
          <Route
            path="/contributors/:owner/:repo"
            element={<Contributors />}
          />
          <Route
            path="/issues/:owner/:repo"
            element={<Issues />}
          />
          <Route
            path="/prs/:owner/:repo"
            element={<PullRequests />}
          />
          <Route
            path="/releases/:owner/:repo"
            element={<Releases />}
          />
          <Route
            path="/quality/:owner/:repo"
            element={<Quality />}
          />
          <Route
            path="/ci/:owner/:repo"
            element={<CIHealth />}
          />
          <Route
            path="/complexity/:owner/:repo"
            element={<Complexity />}
          />
          <Route
            path="/security/:owner/:repo"
            element={<Security />}
          />
          <Route
            path="/sbom/:owner/:repo"
            element={<SBOM />}
          />
          <Route
            path="/ai/:owner/:repo"
            element={<AIInsights />}
          />
          <Route
            path="/activity/:owner/:repo"
            element={<Activity />}
          />
          <Route
            path="/trends/:owner/:repo"
            element={<Trends />}
          />
          <Route
            path="/report/:owner/:repo"
            element={<Report />}
          />
          <Route
            path="/compare"
            element={<Compare />}
          />
          <Route
            path="/compare/:owner1/:repo1/:owner2/:repo2"
            element={<Compare />}
          />
          <Route
            path="/user"
            element={<DeveloperProfile />}
          />
          <Route
            path="/user/:username"
            element={<DeveloperProfile />}
          />
          <Route
            path="/org"
            element={<OrgDashboard />}
          />
          <Route
            path="/org/:org"
            element={<OrgDashboard />}
          />
          <Route
            path="/watchlist"
            element={<Watchlist />}
          />
          <Route
            path="/discover"
            element={<Discovery />}
          />
          <Route
            path="/trending"
            element={<Discovery />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;