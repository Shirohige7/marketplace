const checkoutService = require("../services/checkoutService");

const checkoutController = {
  async checkout(req, res, next) {
    try {
      const { items } = req.body; // [{ productId, qty }]
      const result = await checkoutService.checkout(req.user.sub, items);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = checkoutController;
