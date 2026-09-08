const productRepository = require("../repositories/productRepository");
const { AppError } = require("../utils/errors");

const productService = {
  listProducts(filters) {
    return productRepository.findMany(filters);
  },

  async getProduct(id) {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError("Product not found", 404);
    return product;
  },

  createProduct(vendorId, data) {
    return productRepository.create(vendorId, data);
  },

  // Ownership check lives here, not in the controller: a vendor may only
  // mutate their own products.
  async updateProduct(vendorId, productId, data) {
    const product = await productRepository.findById(productId);
    if (!product) throw new AppError("Product not found", 404);
    if (product.vendorId !== vendorId) throw new AppError("Forbidden", 403);
    return productRepository.update(productId, data);
  },

  async deleteProduct(vendorId, productId) {
    const product = await productRepository.findById(productId);
    if (!product) throw new AppError("Product not found", 404);
    if (product.vendorId !== vendorId) throw new AppError("Forbidden", 403);
    return productRepository.delete(productId);
  },
};

module.exports = productService;
