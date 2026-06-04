import "dotenv/config";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Seeding database...");

  // Cleanup
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  // Warehouses
  const mumbai = await prisma.warehouse.create({
    data: {
      name: "Mumbai Warehouse",
      location: "Mumbai",
    },
  });

  const delhi = await prisma.warehouse.create({
    data: {
      name: "Delhi Warehouse",
      location: "Delhi",
    },
  });

  const bangalore = await prisma.warehouse.create({
    data: {
      name: "Bangalore Warehouse",
      location: "Bangalore",
    },
  });

  // Products
  const macbook = await prisma.product.create({
    data: {
      name: "MacBook Pro",
      description: "Apple MacBook Pro M4",
    },
  });

  const iphone = await prisma.product.create({
    data: {
      name: "iPhone 16",
      description: "Apple iPhone 16",
    },
  });

  const airpods = await prisma.product.create({
    data: {
      name: "AirPods Pro",
      description: "Apple AirPods Pro",
    },
  });

  const monitor = await prisma.product.create({
    data: {
      name: "Dell Monitor",
      description: "Dell 27 inch Monitor",
    },
  });

  const keyboard = await prisma.product.create({
    data: {
      name: "Mechanical Keyboard",
      description: "RGB Mechanical Keyboard",
    },
  });

  // Inventory

  await prisma.inventory.createMany({
    data: [
      {
        productId: macbook.id,
        warehouseId: mumbai.id,
        totalStock: 10,
        reservedStock: 2,
      },
      {
        productId: macbook.id,
        warehouseId: delhi.id,
        totalStock: 5,
        reservedStock: 1,
      },
      {
        productId: iphone.id,
        warehouseId: bangalore.id,
        totalStock: 20,
        reservedStock: 4,
      },
      {
        productId: airpods.id,
        warehouseId: bangalore.id,
        totalStock: 0,
        reservedStock: 0,
      },
      {
        productId: monitor.id,
        warehouseId: mumbai.id,
        totalStock: 15,
        reservedStock: 3,
      },
      {
        productId: keyboard.id,
        warehouseId: delhi.id,
        totalStock: 12,
        reservedStock: 5,
      },
    ],
  });

  console.log("✅ Database seeded successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });