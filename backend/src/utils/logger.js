const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[INFO] ${timestamp} - ${message}`, data);
    } else {
      console.log(`[INFO] ${timestamp} - ${message}`);
    }
  },

  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    if (error) {
      console.error(`[ERROR] ${timestamp} - ${message}`, error);
    } else {
      console.error(`[ERROR] ${timestamp} - ${message}`);
    }
  },

  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.warn(`[WARN] ${timestamp} - ${message}`, data);
    } else {
      console.warn(`[WARN] ${timestamp} - ${message}`);
    }
  },

  debug: (message, data = null) => {
    if (process.env.NODE_ENV === "development") {
      const timestamp = new Date().toISOString();
      if (data) {
        console.log(`[DEBUG] ${timestamp} - ${message}`, data);
      } else {
        console.log(`[DEBUG] ${timestamp} - ${message}`);
      }
    }
  },

  request: (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[REQUEST] ${timestamp} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`
    );
    next();
  }
};

module.exports = logger;