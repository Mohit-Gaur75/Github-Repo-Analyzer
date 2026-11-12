const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const repoRoutes = require("./routes/repo.routes");
const languageRoutes = require("./routes/language.routes");
const commitRoutes = require("./routes/commit.routes");
const contributorRoutes = require("./routes/contributor.routes");
const issueRoutes = require("./routes/issue.routes");
const prRoutes = require("./routes/pr.routes");
const qualityRoutes = require("./routes/quality.routes");
const securityRoutes = require("./routes/security.routes");
const aiRoutes = require("./routes/ai.routes");
const activityRoutes = require("./routes/activity.routes");
const compareRoutes = require("./routes/compare.routes");
const userRoutes = require("./routes/user.routes");
const trendRoutes = require("./routes/trend.routes");
const techstackRoutes = require("./routes/techstack.routes");
const { errorHandler, notFound } = require("./middlewares/error.middleware");
const { validateRequest, validateApiKey } = require("./middlewares/auth.middleware");
const { setCacheHeaders, cacheResponse } = require("./middlewares/cache.middleware");
const { generalRateLimit } = require("./middlewares/rateLimit.middleware");
const logger = require("./utils/logger");

const app = express();
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"]
  })
);


app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(logger.request);
app.use(generalRateLimit);
app.use(setCacheHeaders);
app.use(validateRequest);

// API key validation: only enforce if explicitly required
const requireApiKey = process.env.REQUIRE_API_KEY === "true" || process.env.NODE_ENV === "production";
if (requireApiKey) {
  app.use(validateApiKey);
}


app.get("/health", (req, res) => {
  res.status(200).json({
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "2.0.0"
  });
});


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GitHub Repo Analyzer API is running 🚀",
    version: "2.0.0",
    endpoints: {
      health: "/health",
      validate: "POST /api/repo/validate",
      recent: "/api/repo/recent",
      repo: "/api/repo/:owner/:repo",
      fullAnalysis: "/api/repo/analysis/:owner/:repo",
      languages: "/api/languages/:owner/:repo",
      commits: "/api/commits/:owner/:repo",
      contributors: "/api/contributors/:owner/:repo",
      issues: "/api/issues/:owner/:repo",
      prs: "/api/prs/:owner/:repo",
      quality: "/api/quality/:owner/:repo",
      security: "/api/security/:owner/:repo"
    }
  });
});


app.use("/api/repo", cacheResponse(300), repoRoutes);
app.use("/api/languages", cacheResponse(600), languageRoutes);
app.use("/api/commits", cacheResponse(600), commitRoutes);
app.use("/api/contributors", cacheResponse(600), contributorRoutes);
app.use("/api/issues", cacheResponse(600), issueRoutes);
app.use("/api/prs", cacheResponse(600), prRoutes);
app.use("/api/quality", cacheResponse(600), qualityRoutes);
app.use("/api/security", cacheResponse(600), securityRoutes);
app.use("/api/ai", cacheResponse(1800), aiRoutes); // AI insights cached 30 min
app.use("/api/compare", cacheResponse(300), compareRoutes);
app.use("/api/user", cacheResponse(300), userRoutes);
app.use("/api/trend", cacheResponse(600), trendRoutes);
app.use("/api/techstack", cacheResponse(600), techstackRoutes);
// SSE stream route must bypass the cache middleware entirely
app.use("/api/activity", (req, res, next) => {
  if (req.path.endsWith("/stream")) return next(); // skip cache for SSE
  return cacheResponse(60)(req, res, next);         // cache REST endpoint 60s
}, activityRoutes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;