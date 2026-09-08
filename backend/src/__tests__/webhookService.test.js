jest.mock("../repositories/orderRepository");
jest.mock("../config/db", () => {
  const mockPrisma = {
    webhookEvent: { findUnique: jest.fn(), create: jest.fn() },
    product: { updateMany: jest.fn() },
    vendorLedger: { create: jest.fn() },
    order: { update: jest.fn() },
    payment: { update: jest.fn() },
  };
  // $transaction just runs the callback with the same mock object as `tx` -
  // good enough for unit tests, no real transactional semantics needed.
  mockPrisma.$transaction = jest.fn((fn) => fn(mockPrisma));
  return mockPrisma;
});

const prisma = require("../config/db");
const orderRepository = require("../repositories/orderRepository");
const webhookService = require("../services/webhookService");

const paidOrder = {
  id: "order1",
  status: "PENDING_PAYMENT",
  vendorOrders: [
    {
      vendorId: "vA",
      subtotal: "20.00",
      items: [{ productId: "p1", qty: 2 }],
    },
  ],
};

const event = {
  id: "evt_1",
  type: "payment_intent.succeeded",
  data: { object: { id: "pi_1" } },
};

describe("webhookService.handleStripeEvent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("is a no-op if the Stripe event was already processed (idempotency)", async () => {
    prisma.webhookEvent.findUnique.mockResolvedValue({ stripeEventId: "evt_1" });

    await webhookService.handleStripeEvent(event);

    expect(orderRepository.findByPaymentIntentId).not.toHaveBeenCalled();
    expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
  });

  it("decrements stock, writes the vendor ledger, and marks the order PAID exactly once", async () => {
    prisma.webhookEvent.findUnique.mockResolvedValue(null);
    orderRepository.findByPaymentIntentId.mockResolvedValue(paidOrder);
    prisma.product.updateMany.mockResolvedValue({ count: 1 }); // stock was sufficient

    await webhookService.handleStripeEvent(event);

    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: "p1", stockQty: { gte: 2 } },
      data: { stockQty: { decrement: 2 } },
    });
    expect(prisma.vendorLedger.create).toHaveBeenCalledWith({
      data: { vendorId: "vA", orderId: "order1", amountOwed: "20.00" },
    });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: "order1" },
      data: { status: "PAID" },
    });
    expect(prisma.webhookEvent.create).toHaveBeenCalledWith({
      data: { stripeEventId: "evt_1", type: "payment_intent.succeeded" },
    });
  });

  it("throws if stock is insufficient at payment-confirmation time (race condition guard)", async () => {
    prisma.webhookEvent.findUnique.mockResolvedValue(null);
    orderRepository.findByPaymentIntentId.mockResolvedValue(paidOrder);
    prisma.product.updateMany.mockResolvedValue({ count: 0 }); // conditional UPDATE matched nothing

    await expect(webhookService.handleStripeEvent(event)).rejects.toThrow(/Insufficient stock/);

    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("skips re-processing if the order is already PAID", async () => {
    prisma.webhookEvent.findUnique.mockResolvedValue(null);
    orderRepository.findByPaymentIntentId.mockResolvedValue({ ...paidOrder, status: "PAID" });

    await webhookService.handleStripeEvent(event);

    expect(prisma.product.updateMany).not.toHaveBeenCalled();
  });
});
