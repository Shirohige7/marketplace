const stripeService = require("../services/stripeService");
const webhookService = require("../services/webhookService");

const webhookController = {
  // Mounted with express.raw() — req.body must stay a raw Buffer here.
  async stripeWebhook(req, res) {
    const signature = req.headers["stripe-signature"];

    let event;
    try {
      event = stripeService.constructWebhookEvent(req.body, signature);
    } catch (err) {
      return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }

    try {
      await webhookService.handleStripeEvent(event);
      res.json({ received: true });
    } catch (err) {
      // Returning 500 tells Stripe to retry delivery; handleStripeEvent is
      // idempotent so retries are safe.
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = webhookController;
