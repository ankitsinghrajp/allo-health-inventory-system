import { NextResponse } from "next/server";

export async function GET() {
  const inventoryId = "cmpyzop6h0009xs6md1p04f4w";

  const request1 = fetch(
    "http://localhost:3000/api/reservations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inventoryId,
        quantity: 2,
      }),
    }
  );

  const request2 = fetch(
    "http://localhost:3000/api/reservations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inventoryId,
        quantity: 1,
      }),
    }
  );

  const results = await Promise.all([
    request1,
    request2,
  ]);

  const data = await Promise.all(
    results.map((r) => r.json())
  );

  return NextResponse.json(data);
}