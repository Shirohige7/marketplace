const jwt = require("jsonwebtoken");
const { AppError } = require("../utils/errors");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Missing or invalid Authorization header", 401));
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload: { sub: userId, role, vendorId? }
    req.user = payload;
    next();
  } catch (err) {
    next(new AppError("Invalid or expired token", 401));
  }
}

module.exports = { requireAuth };
