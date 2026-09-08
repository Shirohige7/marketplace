const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const vendorUser = await prisma.user.create({
    data: {
      email: "vendor@example.com",
      passwordHash,
      role: "VENDOR",
      vendor: { create: { storeName: "Demo Store" } },
    },
    include: { vendor: true },
  });

  await prisma.user.create({
    data: { email: "buyer@example.com", passwordHash, role: "BUYER" },
  });

  await prisma.product.createMany({
    data: [
      { vendorId: vendorUser.vendor.id, name: "Coffee Mug", price: 12.5, stockQty: 20 },
      { vendorId: vendorUser.vendor.id, name: "Notebook", price: 6.0, stockQty: 50 },
    ],
  });

  console.log("Seed complete. Login as vendor@example.com / buyer@example.com, password: password123");
}

main().finally(() => prisma.$disconnect());
