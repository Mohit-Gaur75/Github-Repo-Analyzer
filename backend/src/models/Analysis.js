

const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema(
  {
    repoFullName: {
      type: String,
      required: true,
      trim: true
    },
    owner: {
      type: String,
      required: true,
      trim: true
    },
    repo: {
      type: String,
      required: true,
      trim: true
    },
    languages: {
      type: Object,
      default: {}
    },
    commits: {
      type: Object,
      default: {}
    },
    contributors: {
      type: Array,
      default: []
    },
    issues: {
      type: Object,
      default: {}
    },
    pullRequests: {
      type: Object,
      default: {}
    },
    quality: {
      type: Object,
      default: {}
    },
    security: {
      type: Object,
      default: {}
    },
    healthScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    analyzedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

AnalysisSchema.index({ repoFullName: 1 });
AnalysisSchema.index({ owner: 1, repo: 1 });
AnalysisSchema.index({ analyzedAt: -1 });

module.exports = mongoose.model("Analysis", AnalysisSchema);