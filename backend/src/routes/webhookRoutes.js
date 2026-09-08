const express = require("express");
const webhookController = require("../controllers/webhookController");

const router = express.Router();

// NOTE: this route must receive the raw body (see app.js) — it is mounted
// BEFORE the global express.json() middleware for that reason.
router.post("/stripe", webhookController.stripeWebhook);

module.exports = router;
