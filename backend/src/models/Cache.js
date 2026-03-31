const mongoose = require("mongoose");

const CacheSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

CacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

CacheSchema.statics.getCache = async function (key) {
  const cache = await this.findOne({
    key,
    expiresAt: { $gt: new Date() }
  });
  return cache ? cache.data : null;
};

CacheSchema.statics.setCache = async function (key, data, ttlSeconds = 600) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await this.findOneAndUpdate(
    { key },
    { key, data, expiresAt },
    { upsert: true, new: true }
  );
};

CacheSchema.statics.clearCache = async function (key) {
  await this.deleteOne({ key });
};

module.exports = mongoose.model("Cache", CacheSchema);