import { prisma } from "./prisma";

export async function cleanupExpiredReservations() {
  const expiredReservations =
    await prisma.reservation.findMany({
      where: {
        status: "PENDING",
        expiresAt: {
          lt: new Date(),
        },
      },
    });

  for (const reservation of expiredReservations) {
    await prisma.inventory.update({
      where: {
        id: reservation.inventoryId,
      },
      data: {
        reservedStock: {
          decrement: reservation.quantity,
        },
      },
    });
  }

  await prisma.reservation.updateMany({
    where: {
      status: "PENDING",
      expiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: "RELEASED",
    },
  });
}