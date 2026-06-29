export const metadata = {
  title: "Privacy Policy — Skill Evo Marketplace",
  description:
    "How Skill Evo Marketplace collects, uses, and protects your personal information.",
};

const SECTIONS = [
  {
    title: "What information do we collect?",
    body: `We collect personal information that you voluntarily provide when you sign in or participate in the marketplace.

Provided by you: name, email, and profile information shared by your GitHub or Google account when you sign in. Skills you publish, ratings, comments, labels, favorites, and points balance.

Automatically collected: IP address, browser type, device data, and usage data.`,
  },
  {
    title: "How do we process your information?",
    body: `We process your information to operate, improve, and secure the marketplace — including authentication, displaying your activity to other users, processing point transactions, and preventing abuse. We may also use it to communicate with you about your account.`,
  },
  {
    title: "What legal bases do we rely on?",
    body: `We process your information based on consent, performance of contract (operating the marketplace you've signed up for), legitimate interests (preventing abuse, improving the product), and legal obligations.`,
  },
  {
    title: "When and with whom do we share your information?",
    body: `We share your information with: hosting and backend providers that operate the marketplace; payment partners when you cash out earned points; and legal authorities when required by law.

We do not sell your personal data.`,
  },
  {
    title: "Do we use cookies and tracking technologies?",
    body: `We use only the cookies and storage necessary to keep you signed in. We do not use third-party advertising trackers.`,
  },
  {
    title: "How do we handle your social logins?",
    body: `When you sign in with GitHub or Google, we receive your name, email address, profile picture, and a unique account identifier from that provider. We use these to create your Skill Evo account and display your handle. We do not post on your behalf or read any data beyond profile information.`,
  },
  {
    title: "How long do we keep your information?",
    body: `We keep your account information for as long as your account exists. You can request deletion at any time. Public records you've created (published Skills, ratings, comments) may be retained in anonymized form to preserve marketplace integrity.`,
  },
  {
    title: "How do we keep your information safe?",
    body: `We use industry-standard technical and organizational measures including HTTPS encryption in transit, encrypted storage, and access controls. No system is 100% secure, but we work to protect your data against unauthorized access.`,
  },
  {
    title: "Do we collect information from minors?",
    body: `We do not knowingly collect personal information from children under 18. If you believe we have collected such information, please contact us so we can remove it.`,
  },
  {
    title: "What are your privacy rights?",
    body: `Depending on your location, you may have the right to access, update, delete, or export your personal information. To exercise these rights, contact us via the email below.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight text-zinc-950 md:text-4xl dark:text-zinc-50">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-zinc-500">Last updated: 2026-05-26</p>

      <div className="mt-10 space-y-2 border-l-2 border-zinc-200 pl-5 text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
        <p>
          This Privacy Notice for <strong>Skill Evo Marketplace</strong> (&quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;) describes how we collect, store, and use your
          personal information when you use our services, including when you visit our
          website <a href="https://evoskill.market" className="underline underline-offset-4 hover:text-zinc-950 dark:hover:text-zinc-100">https://evoskill.market</a> or engage with us through marketing or events.
        </p>
      </div>

      <ol className="mt-12 space-y-10">
        {SECTIONS.map((s, i) => (
          <li key={s.title} className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-2">
              <p className="font-mono text-xs text-zinc-400">
                {String(i + 1).padStart(2, "0")}
              </p>
            </div>
            <div className="md:col-span-10">
              <h2 className="text-base font-medium text-zinc-950 dark:text-zinc-50">
                {s.title}
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800">
        © 2026 Skill Evo Marketplace. All rights reserved.
      </div>
    </div>
  );
}
