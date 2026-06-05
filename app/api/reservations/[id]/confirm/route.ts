import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { cleanupExpiredReservations } from "@/src/lib/cleanupExpiredReservations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Release stock from any expired reservations before confirmation
    await cleanupExpiredReservations();

    const { id } = await params;
    // Fetch reservation details
    const reservation = await prisma.reservation.findUnique({
      where: {
        id,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        {
          error: "Reservation not found",
        },
        {
          status: 404,
        },
      );
    }

    // Only pending reservations can be confirmed
    if (reservation.status !== "PENDING") {
      return NextResponse.json(
        {
          error: "Reservation is not pending",
        },
        {
          status: 400,
        },
      );
    }

    // Prevent confirmation of expired reservations
    if (new Date() > reservation.expiresAt) {
      return NextResponse.json(
        {
          error: "Reservation expired",
        },
        {
          status: 410,
        },
      );
    }

    // Atomically convert reserved stock into sold/confirmed stock
    await prisma.$transaction(async (tx) => {
      await tx.inventory.update({
        where: {
          id: reservation.inventoryId,
        },
        data: {
          // Remove confirmed quantity from total inventory
          totalStock: {
            decrement: reservation.quantity,
          },
          // Release the reserved quantity
          reservedStock: {
            decrement: reservation.quantity,
          },
        },
      });

      // Mark reservation as confirmed
      await tx.reservation.update({
        where: {
          id,
        },
        data: {
          status: "CONFIRMED",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Reservation confirmed successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
