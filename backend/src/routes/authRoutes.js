const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new buyer or vendor account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               role: { type: string, enum: [BUYER, VENDOR] }
 *               storeName: { type: string, description: "Required when role=VENDOR" }
 *     responses:
 *       201: { description: Account created, returns user + JWT }
 *       409: { description: Email already registered }
 */
router.post("/register", authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200: { description: Returns user + JWT }
 *       401: { description: Invalid credentials }
 */
router.post("/login", authController.login);

module.exports = router;
