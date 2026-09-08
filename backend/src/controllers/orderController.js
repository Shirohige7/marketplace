const orderRepository = require("../repositories/orderRepository");

const orderController = {
  async myOrders(req, res, next) {
    try {
      const orders = await orderRepository.findByBuyer(req.user.sub);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },

  async myVendorOrders(req, res, next) {
    try {
      const vendorOrders = await orderRepository.findByVendor(req.user.vendorId);
      res.json(vendorOrders);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = orderController;
