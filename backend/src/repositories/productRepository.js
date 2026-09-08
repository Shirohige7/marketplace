const prisma = require("../config/db");

const productRepository = {
  findMany({ vendorId } = {}) {
    return prisma.product.findMany({
      where: vendorId ? { vendorId } : undefined,
      include: { vendor: { select: { id: true, storeName: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id) {
    return prisma.product.findUnique({ where: { id }, include: { vendor: true } });
  },

  create(vendorId, data) {
    return prisma.product.create({
      data: {
        vendorId,
        name: data.name,
        description: data.description,
        price: data.price,
        stockQty: data.stockQty,
      },
    });
  },

  update(id, data) {
    return prisma.product.update({ where: { id }, data });
  },

  delete(id) {
    return prisma.product.delete({ where: { id } });
  },
};

module.exports = productRepository;
