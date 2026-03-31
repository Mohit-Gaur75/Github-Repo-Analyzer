const mongoose = require("mongoose");

const RepoSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    fullName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: null
    },
    url: {
      type: String,
      required: true
    },
    stars: {
      type: Number,
      default: 0
    },
    forks: {
      type: Number,
      default: 0
    },
    watchers: {
      type: Number,
      default: 0
    },
    language: {
      type: String,
      default: null
    },
    topics: {
      type: [String],
      default: []
    },
    license: {
      type: String,
      default: null
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    isFork: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    defaultBranch: {
      type: String,
      default: "main"
    },
    openIssuesCount: {
      type: Number,
      default: 0
    },
    owner_info: {
      login: String,
      avatar: String,
      url: String
    },
    createdAt_github: {
      type: Date,
      default: null
    },
    updatedAt_github: {
      type: Date,
      default: null
    },
    lastAnalyzed: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

RepoSchema.index({ owner: 1, name: 1 });
RepoSchema.index({ lastAnalyzed: -1 });

module.exports = mongoose.model("Repo", RepoSchema);