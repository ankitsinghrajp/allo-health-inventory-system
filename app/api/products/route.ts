import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  // Fetch inventory along with related product and warehouse details
  const inventory = await prisma.inventory.findMany({
    include: {
      product: true,
      warehouse: true,
    },
  });

  // Transform database response into a frontend-friendly API shape
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

    // Available stock = Total stock - Currently reserved stock
    availableStock: item.totalStock - item.reservedStock,
  }));

  // Return normalized inventory data as JSON response
  return NextResponse.json(products);
}
