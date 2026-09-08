const express = require("express");
const checkoutController = require("../controllers/checkoutController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

/**
 * @openapi
 * /checkout:
 *   post:
 *     summary: Checkout the buyer's cart. Splits items by vendor into one Order
 *       with per-vendor VendorOrders, and creates a single Stripe PaymentIntent
 *       for the combined total. Order status only flips to PAID once the
 *       Stripe webhook confirms payment.
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, qty]
 *                   properties:
 *                     productId: { type: string }
 *                     qty: { type: integer }
 *     responses:
 *       201:
 *         description: Order created, returns Stripe client secret for the frontend
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId: { type: string }
 *                 clientSecret: { type: string }
 *       409: { description: Insufficient stock for one or more items }
 */
router.post("/", requireAuth, requireRole("BUYER"), checkoutController.checkout);

module.exports = router;
