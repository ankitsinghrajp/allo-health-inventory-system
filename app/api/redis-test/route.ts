import { redis } from "@/src/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
  await redis.set("test", "hello");

  const value = await redis.get("test");

  return NextResponse.json({
    value,
  });
}