const prisma = require("../config/db");

const orderRepository = {
  // Creates Order + per-vendor VendorOrder + OrderItem rows in one transaction.
  // `itemsByVendor` = Map<vendorId, { subtotal, items: [{productId, qty, unitPrice}] }>
  createOrderWithVendorSplit({ buyerId, totalAmount, itemsByVendor }) {
    return prisma.order.create({
      data: {
        buyerId,
        totalAmount,
        status: "PENDING_PAYMENT",
        vendorOrders: {
          create: Array.from(itemsByVendor.entries()).map(([vendorId, group]) => ({
            vendorId,
            subtotal: group.subtotal,
            items: {
              create: group.items.map((item) => ({
                productId: item.productId,
                qty: item.qty,
                unitPrice: item.unitPrice,
              })),
            },
          })),
        },
      },
      include: { vendorOrders: { include: { items: true } } },
    });
  },

  attachPaymentIntent(orderId, stripePaymentIntentId) {
    return prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentIntentId },
    });
  },

  findByPaymentIntentId(stripePaymentIntentId) {
    return prisma.order.findUnique({
      where: { stripePaymentIntentId },
      include: { vendorOrders: { include: { items: true } } },
    });
  },

  markPaid(orderId) {
    return prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } });
  },

  findByBuyer(buyerId) {
    return prisma.order.findMany({
      where: { buyerId },
      include: { vendorOrders: { include: { items: { include: { product: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  },

  findByVendor(vendorId) {
    return prisma.vendorOrder.findMany({
      where: { vendorId },
      include: { items: { include: { product: true } }, order: true },
      orderBy: { id: "desc" },
    });
  },
};

module.exports = orderRepository;
