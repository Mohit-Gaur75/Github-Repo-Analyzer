const {
  getAllSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  testWebhook,
  getDeliveryHistory,
  getEventCatalog
} = require("../services/webhook.service");
const { asyncHandler } = require("../middlewares/error.middleware");

exports.getSubscriptions = asyncHandler(async (req, res) => {
  const data = await getAllSubscriptions();
  const events = getEventCatalog();
  res.json({
    success: true,
    data,
    events
  });
});

exports.createSubscription = asyncHandler(async (req, res) => {
  const { repo, channel, destinationUrl, events } = req.body;
  const sub = await createSubscription({ repo, channel, destinationUrl, events });
  res.status(201).json({
    success: true,
    data: sub,
    message: "Alert subscription created successfully"
  });
});

exports.updateSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await updateSubscription(id, req.body);
  res.json({
    success: true,
    data: updated,
    message: "Subscription updated successfully"
  });
});

exports.deleteSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteSubscription(id);
  res.json({
    success: true,
    data: result,
    message: "Subscription deleted successfully"
  });
});

exports.testWebhook = asyncHandler(async (req, res) => {
  const { channel, destinationUrl, eventType, repo } = req.body;
  const result = await testWebhook({ channel, destinationUrl, eventType, repo });
  res.json({
    success: true,
    data: result
  });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const history = await getDeliveryHistory();
  res.json({
    success: true,
    data: history
  });
});
