import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Languages from "./pages/Languages";
import Commits from "./pages/Commits";
import Contributors from "./pages/Contributors";
import Issues from "./pages/Issues";
import PullRequests from "./pages/PullRequests";
import Quality from "./pages/Quality";
import Security from "./pages/Security";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <div className="app">
      <Navbar />
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
            path="/quality/:owner/:repo"
            element={<Quality />}
          />
          <Route
            path="/security/:owner/:repo"
            element={<Security />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;