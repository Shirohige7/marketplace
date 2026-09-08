const express = require("express");
const orderController = require("../controllers/orderController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

/**
 * @openapi
 * /orders/mine:
 *   get:
 *     summary: List the logged-in buyer's orders, with per-vendor sub-order status
 *     tags: [Orders]
 *     responses:
 *       200: { description: List of orders }
 */
router.get("/mine", requireAuth, requireRole("BUYER"), orderController.myOrders);

/**
 * @openapi
 * /orders/vendor/mine:
 *   get:
 *     summary: List the logged-in vendor's sub-orders across all buyer orders
 *     tags: [Orders]
 *     responses:
 *       200: { description: List of vendor sub-orders }
 */
router.get("/vendor/mine", requireAuth, requireRole("VENDOR"), orderController.myVendorOrders);

module.exports = router;
