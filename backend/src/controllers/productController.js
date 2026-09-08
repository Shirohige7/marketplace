const productService = require("../services/productService");

const productController = {
  async list(req, res, next) {
    try {
      const { vendorId } = req.query;
      const products = await productService.listProducts({ vendorId });
      res.json(products);
    } catch (err) {
      next(err);
    }
  },

  async get(req, res, next) {
    try {
      const product = await productService.getProduct(req.params.id);
      res.json(product);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const product = await productService.createProduct(req.user.vendorId, req.body);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const product = await productService.updateProduct(req.user.vendorId, req.params.id, req.body);
      res.json(product);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      await productService.deleteProduct(req.user.vendorId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};

module.exports = productController;
