import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { cleanupExpiredReservations } from "@/src/lib/cleanupExpiredReservations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await cleanupExpiredReservations();

    const { id } = await params;

    const reservation =
      await prisma.reservation.findUnique({
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
        }
      );
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            "Reservation is not pending",
        },
        {
          status: 400,
        }
      );
    }

    if (
      new Date() >
      reservation.expiresAt
    ) {
      return NextResponse.json(
        {
          error:
            "Reservation expired",
        },
        {
          status: 410,
        }
      );
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.inventory.update({
          where: {
            id: reservation.inventoryId,
          },
          data: {
            totalStock: {
              decrement:
                reservation.quantity,
            },

            reservedStock: {
              decrement:
                reservation.quantity,
            },
          },
        });

        await tx.reservation.update({
          where: {
            id,
          },
          data: {
            status: "CONFIRMED",
          },
        });
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "Reservation confirmed successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}