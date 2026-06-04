import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const inventory = await prisma.inventory.findMany({
    include: {
      product: true,
      warehouse: true,
    },
  });

  const products = inventory.map((item) => ({
    inventoryId: item.id,

    productId: item.productId,
    productName: item.product.name,
    productDescription: item.product.description,

    warehouseId: item.warehouseId,
    warehouseName: item.warehouse.name,
    warehouseLocation: item.warehouse.location,

    totalStock: item.totalStock,
    reservedStock: item.reservedStock,
    availableStock:
      item.totalStock - item.reservedStock,
  }));

  return NextResponse.json(products);
}