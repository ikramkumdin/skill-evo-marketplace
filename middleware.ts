import { NextResponse } from "next/server";
import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

const realMiddleware = convexAuthNextjsMiddleware();

export default isConvexConfigured ? realMiddleware : () => NextResponse.next();

// Matcher excludes the fully-static, no-auth-needed public pages so
// Next's own revalidate/cache headers take effect on them. Convex's
// middleware wraps responses with `Cache-Control: no-store` to keep
// session cookies fresh, which was overriding the `revalidate = 3600`
// on /for-agents and defeating the 503 fix for prefetch pressure.
//
// Everything else (home, skills, users, api/*) still runs through the
// middleware so SSR fetchQuery can call convexAuthNextjsToken().
export const config = {
  matcher: [
    "/((?!.*\\..*|_next|favicon\\.ico|for-agents|about|privacy|terms|submission-rules).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
