import { NextRequest, NextResponse } from "next/server";

const CONVEX_SITE_URL =
  process.env.CONVEX_SITE_URL ?? "https://determined-finch-765.convex.site";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${CONVEX_SITE_URL}/api/agent/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
