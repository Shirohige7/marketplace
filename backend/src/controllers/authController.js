const authService = require("../services/authService");

function sanitizeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

const authController = {
  async register(req, res, next) {
    try {
      const { email, password, role, storeName } = req.body;
      const { user, token } = await authService.register({ email, password, role, storeName });
      res.status(201).json({ user: sanitizeUser(user), token });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login({ email, password });
      res.json({ user: sanitizeUser(user), token });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
