import { NextRequest, NextResponse } from "next/server";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://determined-finch-765.convex.cloud";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const auth = req.headers.get("authorization");

  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: auth } : {}),
    },
    body,
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
