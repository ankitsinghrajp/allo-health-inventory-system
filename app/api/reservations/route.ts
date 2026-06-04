import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { acquireLock, releaseLock } from "@/src/lib/lock";
import { cleanupExpiredReservations } from "@/src/lib/cleanupExpiredReservations";

async function acquireLockWithRetry(
  lockKey: string,
  maxWaitMs = 5000,
  retryIntervalMs = 100
) {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const acquired = await acquireLock(lockKey);

    if (acquired) {
      return true;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, retryIntervalMs)
    );
  }

  return false;
}

export async function POST(req: NextRequest) {
  let lockKey = "";
  let inventoryId = "";

  try {
    const body = await req.json();

    inventoryId = body.inventoryId;
    const quantity = body.quantity;

    if (!inventoryId || !quantity || quantity <= 0) {
      return NextResponse.json(
        {
          error: "Invalid request body",
        },
        {
          status: 400,
        }
      );
    }

    // Cleanup before acquiring lock
    await cleanupExpiredReservations();

    lockKey = `lock:inventory:${inventoryId}`;

    console.log("TRYING LOCK:", inventoryId);

    const acquired = await acquireLockWithRetry(lockKey);

    if (!acquired) {
      console.log(
        "FAILED TO ACQUIRE LOCK:",
        inventoryId
      );

      return NextResponse.json(
        {
          error:
            "Could not acquire reservation lock after retries",
        },
        {
          status: 423,
        }
      );
    }

    console.log(
      "LOCK ACQUIRED:",
      inventoryId
    );

    const reservation =
      await prisma.$transaction(async (tx) => {
        const inventory =
          await tx.inventory.findUnique({
            where: {
              id: inventoryId,
            },
          });

        if (!inventory) {
          throw new Error("INVENTORY_NOT_FOUND");
        }

        const availableStock =
          inventory.totalStock -
          inventory.reservedStock;

        console.log(
          "AVAILABLE STOCK:",
          availableStock
        );

        if (availableStock < quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        const createdReservation =
          await tx.reservation.create({
            data: {
              inventoryId,
              quantity,
              status: "PENDING",
              expiresAt: new Date(
                Date.now() + 10 * 60 * 1000
              ),
            },
          });

        await tx.inventory.update({
          where: {
            id: inventoryId,
          },
          data: {
            reservedStock: {
              increment: quantity,
            },
          },
        });

        return createdReservation;
      });

    return NextResponse.json(
      {
        success: true,
        reservation,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INSUFFICIENT_STOCK"
    ) {
      return NextResponse.json(
        {
          error: "Not enough stock available",
        },
        {
          status: 409,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVENTORY_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error: "Inventory not found",
        },
        {
          status: 404,
        }
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  } finally {
    console.log(
      "RELEASING LOCK:",
      inventoryId
    );

    if (lockKey) {
      await releaseLock(lockKey);
    }
  }
}