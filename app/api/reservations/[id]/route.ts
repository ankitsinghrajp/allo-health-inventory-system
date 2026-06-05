import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { cleanupExpiredReservations } from "@/src/lib/cleanupExpiredReservations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Ensure expired reservations are cleaned up before returning data
    await cleanupExpiredReservations();

    const { id } = await params;

    // Fetch reservation along with inventory, product,
    // and warehouse information for detailed response
    const reservation = await prisma.reservation.findUnique({
      where: {
        id,
      },
      include: {
        inventory: {
          include: {
            product: true,
            warehouse: true,
          },
        },
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

    // Return reservation details including related inventory metadata
    return NextResponse.json({
      success: true,
      reservation,
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
