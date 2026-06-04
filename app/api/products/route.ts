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
    warehouseId: item.warehouseId,

    productName: item.product.name,
    warehouseName: item.warehouse.name,

    totalStock: item.totalStock,
    reservedStock: item.reservedStock,
    availableStock: item.totalStock - item.reservedStock,
  }));

  return NextResponse.json(products);
}