
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      default: "guest"
    },
    searchHistory: [
      {
        repoFullName: {
          type: String,
          required: true
        },
        owner: {
          type: String,
          required: true
        },
        repo: {
          type: String,
          required: true
        },
        searchedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    totalSearches: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

UserSchema.index({ username: 1 });
UserSchema.index({ lastActive: -1 });

module.exports = mongoose.model("User", UserSchema);
