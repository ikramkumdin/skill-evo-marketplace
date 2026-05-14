"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORIES } from "@/lib/categories";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function PublishForm() {
  if (!isConvexConfigured) {
    return (
      <Banner kind="warn" title="Convex not configured">
        Run <Code>npx convex dev</Code> in the marketplace folder to enable real
        submissions. The setup steps live in <Code>SETUP.md</Code>.
      </Banner>
    );
  }
  return <ConnectedPublishForm />;
}

function ConnectedPublishForm() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const submit = useMutation(api.skills.submit);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Banner kind="info" title="Loading...">
        Checking your sign-in state.
      </Banner>
    );
  }

  if (!isAuthenticated) {
    return (
      <Banner kind="warn" title="Sign in to publish">
        <p className="mb-3 text-xs opacity-90">
          We use GitHub sign-in so submitters are accountable. Click below to authenticate.
        </p>
        <button
          type="button"
          onClick={() => signIn("github", { redirectTo: "/publish" })}
          className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Sign in with GitHub
        </button>
      </Banner>
    );
  }

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const githubUrl = String(fd.get("githubUrl") ?? "").trim();
    const name = String(fd.get("name") ?? "").trim();
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const rawPrice = parseInt(String(fd.get("pricePoints") ?? "0"), 10);
    const payload = {
      name,
      tagline: String(fd.get("tagline") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim(),
      githubUrl,
      installCommand: `git clone ${githubUrl} ~/.claude/skills/${slug}`,
      category: String(fd.get("category") ?? ""),
      tags: String(fd.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5),
      pricePoints: rawPrice > 0 ? rawPrice : undefined,
    };
    try {
      const result = await submit(payload);
      router.push(`/skills/${result.slug}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Submission failed.";
      setError(msg);
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <Field label="Skill name" hint="A short, memorable name. 60 characters max." required>
        <input type="text" name="name" required maxLength={60} placeholder="GitHub PR Reviewer" className={inputCls} />
      </Field>

      <Field label="GitHub repository URL" hint="The public repo where the Skill source lives." required>
        <input type="url" name="githubUrl" required placeholder="https://github.com/your-handle/your-skill" className={inputCls} />
      </Field>

      <Field label="Tagline" hint="One-sentence pitch." required>
        <input type="text" name="tagline" required maxLength={120} placeholder="Automated PR review with security and style checks" className={inputCls} />
      </Field>

      <Field label="Description" hint="What does it do, when should someone use it, what does it depend on?" required>
        <textarea name="description" required rows={6} placeholder="Reviews pull requests for security issues..." className={textareaCls} />
      </Field>

      <Field label="Category" required>
        <select name="category" required defaultValue="" className={inputCls}>
          <option value="" disabled>
            Pick a category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.description}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tags" hint="Comma-separated. Up to 5 tags — keep them specific.">
        <input type="text" name="tags" placeholder="github, code-review, security" className={inputCls} />
      </Field>

      <Field label="Price (optional)" hint="Set a point price to sell this Skill. Leave blank or 0 for free.">
        <input type="number" name="pricePoints" min={0} max={10000} step={10} placeholder="0 (free)" className={inputCls} />
      </Field>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/skills" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {busy ? "Submitting..." : "Publish Skill"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-700 dark:focus:ring-indigo-950";

const textareaCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-700 dark:focus:ring-indigo-950";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function Banner({
  kind,
  title,
  children,
}: {
  kind: "info" | "warn";
  title: string;
  children: React.ReactNode;
}) {
  const colors =
    kind === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
  return (
    <div className={`rounded-lg border p-4 text-sm ${colors}`}>
      <p className="font-medium">{title}</p>
      <div className="mt-1 text-xs opacity-90">{children}</div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-[11px] dark:bg-white/10">
      {children}
    </code>
  );
}
