const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const stripeService = {
  createPaymentIntent(amountCents, metadata) {
    return stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      metadata, // e.g. { orderId }
      automatic_payment_methods: { enabled: true },
    });
  },

  // req.body must be the RAW request body (Buffer), not JSON-parsed,
  // or Stripe's signature check will fail.
  constructWebhookEvent(rawBody, signature) {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  },
};

module.exports = stripeService;
