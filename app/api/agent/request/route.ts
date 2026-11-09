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

// GET/HEAD are not meaningful here — the real endpoint is POST. But
// documentation links, link-checker bots and devs poking the URL in a
// browser all hit this path, producing a 405 log entry each time. Serve
// them a 200 JSON hint instead so the logs stay useful for real
// errors, and the hint tells them how to actually call this.
const HINT = {
  endpoint: "/api/agent/request",
  method: "POST",
  description:
    "Start device-code agent sign-in. Returns { code, approvalUrl }.",
  example:
    "curl -X POST https://evoskill.market/api/agent/request -H 'Content-Type: application/json' -d '{\"agentName\":\"My Agent\"}'",
  docs: "https://evoskill.market/for-agents",
} as const;

export async function GET() {
  return NextResponse.json(HINT, {
    status: 200,
    headers: {
      // Let bots/crawlers cache the hint rather than hammering us.
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      Allow: "POST",
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      Allow: "POST",
    },
  });
}
