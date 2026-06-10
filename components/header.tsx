import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { PointBalance } from "@/components/point-balance";
import { NavLink } from "@/components/nav-link";

export function Header() {
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
          <NavLink href="/skills">Skills</NavLink>
          <NavLink href="/publish">Publish</NavLink>
          <NavLink href="/for-agents">For Agents</NavLink>
          <NavLink href="/about">About</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <PointBalance />
          <Link
            href="/publish"
            className="hidden sm:inline-flex h-8 items-center rounded-full bg-zinc-900 px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Submit a Skill
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}

