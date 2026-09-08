const { PrismaClient } = require("@prisma/client");

// Single shared Prisma client instance (repository layer depends on this).
const prisma = new PrismaClient();

module.exports = prisma;
