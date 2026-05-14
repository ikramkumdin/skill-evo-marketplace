import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
                E
              </div>
              <span className="text-xs font-semibold">Skill Evo</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              A marketplace for AI agent Skills. Discover, install, and publish.
            </p>
          </div>

          <FooterCol title="Browse">
            <FooterLink href="/skills">All Skills</FooterLink>
            <FooterLink href="/skills?category=mcp-tools">MCP Tools</FooterLink>
            <FooterLink href="/skills?category=dev-tools">Dev Tools</FooterLink>
            <FooterLink href="/skills?category=automation">Automation</FooterLink>
          </FooterCol>

          <FooterCol title="Build">
            <FooterLink href="/publish">Publish a Skill</FooterLink>
            <FooterLink href="/about">Submission rules</FooterLink>
            <FooterLink href="https://github.com" external>
              GitHub
            </FooterLink>
          </FooterCol>

          <FooterCol title="Platform">
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="#">Terms</FooterLink>
            <FooterLink href="#">Privacy</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-zinc-200 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <span>© 2026 Skill Evo Marketplace</span>
          <span>Built for the agent era.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold tracking-wide uppercase text-zinc-500">{title}</h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="text-xs text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        {children}
      </Link>
    </li>
  );
}
