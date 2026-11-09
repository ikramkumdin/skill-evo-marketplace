"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { AuthButton } from "@/components/auth-button";
import { PointBalance } from "@/components/point-balance";
import { NavLink } from "@/components/nav-link";
import { NotificationBell } from "@/components/notification-bell";
import { SignInButtons } from "@/components/sign-in-buttons";

const NAV = [
  { href: "/skills", label: "Skills" },
  { href: "/publish", label: "Publish" },
  { href: "/for-agents", label: "For Agents" },
  { href: "/about", label: "About" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever navigation happens so it doesn't stay open
  // over the new page.
  useEffect(() => setOpen(false), [pathname]);

  // Lock scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105">
            E
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Skill Evo <span className="text-zinc-500 dark:text-zinc-400">Marketplace</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {NAV.map((n) => (
            <NavLink key={n.href} href={n.href}>{n.label}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <PointBalance />
          <Link
            href="/publish"
            className="hidden sm:inline-flex h-8 items-center rounded-full bg-zinc-900 px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Submit a Skill
          </Link>
          <div className="hidden md:block">
            <AuthButton />
          </div>

          {/* Hamburger — mobile only. Desktop above md hides it. */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-14 z-30 bg-black/40 backdrop-blur-sm"
          />
          <div
            id="mobile-nav-drawer"
            className="fixed inset-x-0 top-14 z-40 border-b border-zinc-200 bg-white px-6 pb-6 pt-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            <nav className="flex flex-col gap-1 text-sm">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <Link
                href="/publish"
                onClick={() => setOpen(false)}
                prefetch={false}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Submit a Skill
              </Link>
              {/* AuthButton's own menu is hidden below `sm` width because
                  the dropdown isn't ergonomic on a phone. Inline the
                  authenticated / anonymous action set directly here so
                  mobile users actually see Profile / Cash Out / Sign Out. */}
              <MobileAuthLinks onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileAuthLinks({ onNavigate }: { onNavigate: () => void }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [busy, setBusy] = useState(false);

  if (isLoading) {
    return (
      <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
    );
  }

  if (isAuthenticated) {
    return (
      <>
        <Link
          href="/me"
          onClick={onNavigate}
          prefetch={false}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        >
          👤 My Profile
        </Link>
        <Link
          href="/points/cashout"
          onClick={onNavigate}
          prefetch={false}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        >
          💰 Cash Out
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await signOut();
            } finally {
              setBusy(false);
              onNavigate();
            }
          }}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        >
          {busy ? "Signing out…" : "Sign out"}
        </button>
      </>
    );
  }

  return (
    <div className="pt-1">
      <SignInButtons size="sm" />
    </div>
  );
}
