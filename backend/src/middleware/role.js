const { AppError } = require("../utils/errors");

// Usage: requireRole("VENDOR", "ADMIN")
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Forbidden: insufficient role", 403));
    }
    next();
  };
}

module.exports = { requireRole };
