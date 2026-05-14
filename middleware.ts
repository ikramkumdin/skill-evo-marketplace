import { NextResponse } from "next/server";
import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

const realMiddleware = convexAuthNextjsMiddleware();

export default isConvexConfigured ? realMiddleware : () => NextResponse.next();

export const config = {
  matcher: [
    "/((?!.*\\..*|_next|favicon\\.ico).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
