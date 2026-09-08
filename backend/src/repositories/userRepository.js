const prisma = require("../config/db");

const userRepository = {
  findByEmail(email) {
    return prisma.user.findUnique({ where: { email }, include: { vendor: true } });
  },

  findById(id) {
    return prisma.user.findUnique({ where: { id }, include: { vendor: true } });
  },

  create({ email, passwordHash, role }) {
    return prisma.user.create({ data: { email, passwordHash, role } });
  },

  createVendorProfile(userId, storeName) {
    return prisma.vendor.create({ data: { userId, storeName } });
  },
};

module.exports = userRepository;
