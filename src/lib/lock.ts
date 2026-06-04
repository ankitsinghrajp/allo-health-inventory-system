import { redis } from "./redis";

const LOCK_TTL = 10; // seconds

export async function acquireLock(key: string) {
  const result = await redis.set(
    key,
    "locked",
    {
      nx: true,
      ex: LOCK_TTL,
    }
  );

  return result === "OK";
}

export async function releaseLock(key: string) {
  await redis.del(key);
}