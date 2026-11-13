const express = require("express");
const router = express.Router();
const {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  testWebhook,
  getHistory
} = require("../controllers/webhook.controller");

router.get("/subscriptions", getSubscriptions);
router.post("/subscriptions", createSubscription);
router.put("/subscriptions/:id", updateSubscription);
router.delete("/subscriptions/:id", deleteSubscription);
router.post("/test", testWebhook);
router.get("/history", getHistory);

module.exports = router;
