const prisma = require("../config/db");
const orderRepository = require("../repositories/orderRepository");
const { AppError } = require("../utils/errors");

const webhookService = {
  // Called with an already-signature-verified Stripe event.
  // Idempotent: if this event was already processed, it's a no-op.
  async handleStripeEvent(event) {
    const alreadyProcessed = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (alreadyProcessed) return; // Stripe retried a delivery we already handled.

    if (event.type === "payment_intent.succeeded") {
      await webhookService._handlePaymentSucceeded(event.data.object);
    }
    // Other event types (payment_intent.payment_failed, etc.) can be added here.

    await prisma.webhookEvent.create({
      data: { stripeEventId: event.id, type: event.type },
    });
  },

  async _handlePaymentSucceeded(paymentIntent) {
    const order = await orderRepository.findByPaymentIntentId(paymentIntent.id);
    if (!order) return; // Defensive: unknown intent, nothing to reconcile.
    if (order.status === "PAID") return; // Already handled.

    await prisma.$transaction(async (tx) => {
      // Atomic, conditional stock decrement: the WHERE clause guarantees we
      // never oversell even under concurrent checkouts for the same product.
      for (const vendorOrder of order.vendorOrders) {
        for (const item of vendorOrder.items) {
          const result = await tx.product.updateMany({
            where: { id: item.productId, stockQty: { gte: item.qty } },
            data: { stockQty: { decrement: item.qty } },
          });
          if (result.count === 0) {
            // Stock disappeared between checkout and payment confirmation.
            // In production this should trigger a partial refund / manual
            // review flow; for the project scope we surface it as an error.
            throw new AppError(`Insufficient stock for product ${item.productId} at payment time`, 409);
          }
        }

        await tx.vendorLedger.create({
          data: {
            vendorId: vendorOrder.vendorId,
            orderId: order.id,
            amountOwed: vendorOrder.subtotal,
          },
        });
      }

      await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });
      await tx.payment.update({
        where: { orderId: order.id },
        data: { status: "succeeded" },
      });
    });
  },
};

module.exports = webhookService;
