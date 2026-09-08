require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const orderRoutes = require("./routes/orderRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const swaggerSpec = require("./config/swagger");
const { AppError } = require("./utils/errors");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));

// http://localhost:4000/docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// IMPORTANT: the Stripe webhook route needs the raw request body to verify
// the signature, so it's mounted BEFORE express.json() and given its own
// raw body parser. Every other route gets normal JSON parsing.
app.use("/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/checkout", checkoutRoutes);
app.use("/orders", orderRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Centralized error handler
app.use((err, req, res, next) => {
  const status = err instanceof AppError ? err.statusCode : 500;
  if (!(err instanceof AppError)) console.error(err);
  res.status(status).json({ error: err.message || "Internal server error" });
});

module.exports = app;
