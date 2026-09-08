const prisma = require("../config/db");
const productRepository = require("../repositories/productRepository");
const orderRepository = require("../repositories/orderRepository");
const stripeService = require("../services/stripeService");
const { AppError } = require("../utils/errors");

const checkoutService = {
  // cartItems: [{ productId, qty }]
  // Splits the cart into one VendorOrder per vendor, creates a single
  // Order + single Stripe PaymentIntent for the combined total.
  async checkout(buyerId, cartItems) {
    if (!cartItems || cartItems.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    const products = await Promise.all(
      cartItems.map((item) => productRepository.findById(item.productId))
    );

    const itemsByVendor = new Map();
    let totalAmount = 0;

    cartItems.forEach((cartItem, idx) => {
      const product = products[idx];
      if (!product) throw new AppError(`Product ${cartItem.productId} not found`, 404);
      if (product.stockQty < cartItem.qty) {
        throw new AppError(`Not enough stock for ${product.name}`, 409);
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * cartItem.qty;
      totalAmount += lineTotal;

      const group = itemsByVendor.get(product.vendorId) || { subtotal: 0, items: [] };
      group.subtotal += lineTotal;
      group.items.push({ productId: product.id, qty: cartItem.qty, unitPrice });
      itemsByVendor.set(product.vendorId, group);
    });

    // Note: stock is NOT decremented here. It's decremented only when the
    // webhook confirms payment succeeded — see the design rationale below.
    const order = await orderRepository.createOrderWithVendorSplit({
      buyerId,
      totalAmount,
      itemsByVendor,
    });

    const paymentIntent = await stripeService.createPaymentIntent(
      Math.round(totalAmount * 100), // Stripe amounts are in cents
      { orderId: order.id }
    );

    await orderRepository.attachPaymentIntent(order.id, paymentIntent.id);
    await prisma.payment.create({
      data: {
        orderId: order.id,
        stripePaymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: totalAmount,
      },
    });

    return { orderId: order.id, clientSecret: paymentIntent.client_secret };
  },
};

module.exports = checkoutService;
