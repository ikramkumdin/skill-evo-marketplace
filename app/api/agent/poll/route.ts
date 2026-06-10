import { NextRequest, NextResponse } from "next/server";

const CONVEX_SITE_URL =
  process.env.CONVEX_SITE_URL ?? "https://determined-finch-765.convex.site";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";
  const res = await fetch(
    `${CONVEX_SITE_URL}/api/agent/poll?code=${encodeURIComponent(code)}`,
    { method: "GET" },
  );
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
