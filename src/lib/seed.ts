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

  // Cleanup existing data
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
  const gamingLaptop = await prisma.product.create({
    data: {
      name: "ASUS ROG Strix G16",
      description: "High-performance gaming laptop",
    },
  });

  const gamingChair = await prisma.product.create({
    data: {
      name: "Green Soul Gaming Chair",
      description: "Ergonomic gaming chair",
    },
  });

  const smartwatch = await prisma.product.create({
    data: {
      name: "Samsung Galaxy Watch 7",
      description: "Smart fitness and health tracking watch",
    },
  });

  const drone = await prisma.product.create({
    data: {
      name: "DJI Mini 4 Pro",
      description: "Lightweight professional drone",
    },
  });

  const projector = await prisma.product.create({
    data: {
      name: "Epson Home Projector",
      description: "Full HD home entertainment projector",
    },
  });

  const printer = await prisma.product.create({
    data: {
      name: "HP LaserJet Pro",
      description: "Wireless monochrome laser printer",
    },
  });

  const router = await prisma.product.create({
    data: {
      name: "TP-Link Archer AX73",
      description: "Wi-Fi 6 high-speed router",
    },
  });

  const microphone = await prisma.product.create({
    data: {
      name: "Blue Yeti Microphone",
      description: "Professional USB microphone",
    },
  });

  const graphicsCard = await prisma.product.create({
    data: {
      name: "NVIDIA RTX 4070",
      description: "High-end graphics card",
    },
  });

  const vrHeadset = await prisma.product.create({
    data: {
      name: "Meta Quest 3",
      description: "Standalone VR headset",
    },
  });

  // Inventory
  await prisma.inventory.createMany({
    data: [
      {
        productId: gamingLaptop.id,
        warehouseId: mumbai.id,
        totalStock: 48,
        reservedStock: 3,
      },
      {
        productId: gamingChair.id,
        warehouseId: delhi.id,
        totalStock: 42,
        reservedStock: 5,
      },
      {
        productId: smartwatch.id,
        warehouseId: bangalore.id,
        totalStock: 38,
        reservedStock: 4,
      },
      {
        productId: drone.id,
        warehouseId: mumbai.id,
        totalStock: 35,
        reservedStock: 2,
      },
      {
        productId: projector.id,
        warehouseId: delhi.id,
        totalStock: 30,
        reservedStock: 3,
      },
      {
        productId: printer.id,
        warehouseId: bangalore.id,
        totalStock: 28,
        reservedStock: 2,
      },
      {
        productId: router.id,
        warehouseId: mumbai.id,
        totalStock: 25,
        reservedStock: 1,
      },
      {
        productId: microphone.id,
        warehouseId: delhi.id,
        totalStock: 20,
        reservedStock: 2,
      },
      {
        productId: graphicsCard.id,
        warehouseId: bangalore.id,
        totalStock: 15,
        reservedStock: 3,
      },
      {
        productId: vrHeadset.id,
        warehouseId: mumbai.id,
        totalStock: 10,
        reservedStock: 0,
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