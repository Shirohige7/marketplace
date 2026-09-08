const express = require("express");
const productController = require("../controllers/productController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

/**
 * @openapi
 * /products:
 *   get:
 *     summary: List products (public catalog, optionally filtered by vendor)
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: vendorId
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of products }
 *   post:
 *     summary: Create a product (vendor only)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, stockQty]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               stockQty: { type: integer }
 *     responses:
 *       201: { description: Product created }
 *       403: { description: Forbidden - not a vendor }
 */
router.get("/", productController.list);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Get a single product by id
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Product }
 *       404: { description: Not found }
 *   put:
 *     summary: Update a product (owning vendor only)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated product }
 *       403: { description: Forbidden - not the owning vendor }
 *   delete:
 *     summary: Delete a product (owning vendor only)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       403: { description: Forbidden - not the owning vendor }
 */
router.get("/:id", productController.get);
router.post("/", requireAuth, requireRole("VENDOR"), productController.create);
router.put("/:id", requireAuth, requireRole("VENDOR"), productController.update);
router.delete("/:id", requireAuth, requireRole("VENDOR"), productController.remove);

module.exports = router;
