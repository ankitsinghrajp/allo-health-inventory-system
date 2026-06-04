import { NextResponse } from "next/server";
import { acquireLock, releaseLock } from "@/src/lib/lock";

export async function GET() {
  const acquired = await acquireLock(
    "lock:inventory:test"
  );

  if (!acquired) {
    return NextResponse.json({
      success: false,
      message: "Lock already exists",
    });
  }


  await releaseLock(
    "lock:inventory:test"
  );

  return NextResponse.json({
    success: true,
    message: "Lock acquired",
  });
}