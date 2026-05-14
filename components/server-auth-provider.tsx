import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { ReactNode } from "react";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function ServerAuthProvider({ children }: { children: ReactNode }) {
  if (!isConvexConfigured) {
    return <>{children}</>;
  }
  return <ConvexAuthNextjsServerProvider>{children}</ConvexAuthNextjsServerProvider>;
}
