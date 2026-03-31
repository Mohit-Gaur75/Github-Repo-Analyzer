// const requestCounts = new Map();

// const generalRateLimit = (req, res, next) => {
//   const ip = req.ip || req.connection.remoteAddress || "unknown";
//   const now = Date.now();
//   const windowMs = 15 * 60 * 1000;
//   const maxRequests = 100;

//   if (!requestCounts.has(ip)) {
//     requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
//     return next();
//   }

//   const record = requestCounts.get(ip);

//   if (now > record.resetTime) {
//     requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
//     return next();
//   }

//   if (record.count >= maxRequests) {
//     return res.status(429).json({
//       success: false,
//       error: "Too many requests. Please wait 15 minutes before trying again.",
//       retryAfter: Math.ceil((record.resetTime - now) / 1000)
//     });
//   }

//   record.count++;
//   next();
// };

// const strictRateLimit = (req, res, next) => {
//   const ip = req.ip || req.connection.remoteAddress || "unknown";
//   const now = Date.now();
//   const windowMs = 60 * 1000;
//   const maxRequests = 10;
//   const key = `strict_${ip}`;

//   if (!requestCounts.has(key)) {
//     requestCounts.set(key, { count: 1, resetTime: now + windowMs });
//     return next();
//   }

//   const record = requestCounts.get(key);

//   if (now > record.resetTime) {
//     requestCounts.set(key, { count: 1, resetTime: now + windowMs });
//     return next();
//   }

//   if (record.count >= maxRequests) {
//     return res.status(429).json({
//       success: false,
//       error: "Too many requests. Please wait 1 minute.",
//       retryAfter: Math.ceil((record.resetTime - now) / 1000)
//     });
//   }

//   record.count++;
//   next();
// };

// setInterval(() => {
//   const now = Date.now();
//   for (const [key, record] of requestCounts.entries()) {
//     if (now > record.resetTime) {
//       requestCounts.delete(key);
//     }
//   }
// }, 5 * 60 * 1000);

// module.exports = { generalRateLimit, strictRateLimit };


// NOTE: This in-memory rate limiter is suitable for single-instance deployments.
// For production with multiple instances or restarts, replace with:
// express-rate-limit + rate-limit-mongo (or Redis via rate-limit-redis)

const requestCounts = new Map();

const generalRateLimit = (req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.ip ||
    req.connection.remoteAddress ||
    "unknown";
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const record = requestCounts.get(ip);

  if (now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: "Too many requests. Please wait 15 minutes before trying again.",
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  record.count++;
  next();
};

const strictRateLimit = (req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.ip ||
    req.connection.remoteAddress ||
    "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;
  const key = `strict_${ip}`;

  if (!requestCounts.has(key)) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const record = requestCounts.get(key);

  if (now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: "Too many requests. Please wait 1 minute.",
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  record.count++;
  next();
};

// Cleanup expired entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

module.exports = { generalRateLimit, strictRateLimit };
