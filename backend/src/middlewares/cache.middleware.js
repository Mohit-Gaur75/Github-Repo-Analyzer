
const Cache = require("../models/Cache");

const cacheResponse = (ttlSeconds = 600) => {
  return async (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    const cacheKey = `route_${req.originalUrl}`;

    try {
      const cachedData = await Cache.getCache(cacheKey);

      if (cachedData) {
        console.log(`Cache HIT: ${cacheKey}`);
        return res.status(200).json({
          ...cachedData,
          fromCache: true
        });
      }

      console.log(`Cache MISS: ${cacheKey}`);

      const originalJson = res.json.bind(res);

      res.json = async (data) => {
        if (res.statusCode === 200 && data.success) {
          try {
            await Cache.setCache(cacheKey, data, ttlSeconds);
          } catch (cacheError) {
            console.error("Cache write error:", cacheError.message);
          }
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error.message);
      next();
    }
  };
};

const setCacheHeaders = (req, res, next) => {
  res.setHeader("X-Cache-TTL", "600");
  res.setHeader("X-API-Version", "1.0.0");
  next();
};

const clearCacheForRepo = async (owner, repo) => {
  try {
    const pattern = `route_/api`;
    await Cache.deleteMany({
      key: { $regex: `${owner}/${repo}` }
    });
    console.log(`Cache cleared for ${owner}/${repo}`);
  } catch (error) {
    console.error("Cache clear error:", error.message);
  }
};

module.exports = { cacheResponse, setCacheHeaders, clearCacheForRepo };
