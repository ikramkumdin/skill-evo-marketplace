"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      // Next prefetches on hover+intent by default, which sends ~20
      // Convex-backed server requests per page view across the header
      // and category links. On a cold Convex deployment that triggers
      // throttled 503s on background preloads. Disable prefetch here:
      // users still get a fast navigation on click, and the server
      // isn't hammered by preloads that may never be followed.
      prefetch={false}
      className={`rounded-md px-3 py-1.5 transition-colors ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
      }`}
    >
      {children}
    </Link>
  );
}
