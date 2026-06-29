export const metadata = {
  title: "Terms of Service — Skill Evo Marketplace",
  description:
    "Terms governing your use of Skill Evo Marketplace.",
};

const SECTIONS = [
  {
    title: "Our services",
    body: `The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation, or which would subject us to any registration requirement within such jurisdiction or country. Those who access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws.`,
  },
  {
    title: "Intellectual property rights",
    body: `We are the owner or licensee of all intellectual property rights in our Services, including source code, databases, functionality, software, website designs, audio, video, text, and graphics (collectively, the "Content"), as well as the trademarks, service marks, and logos (the "Marks").

Skills you submit (their source code, descriptions, and assets) remain owned by you or their respective authors. By publishing a Skill, you grant Skill Evo Marketplace a non-exclusive license to display, index, and link to it for the purpose of running the marketplace.

Our Content and Marks are protected by copyright and trademark laws and are provided "AS IS" for your personal, non-commercial use.`,
  },
  {
    title: "User representations",
    body: `By using the Services, you represent and warrant that:

— All registration information you submit will be true, accurate, current, and complete;
— You will maintain the accuracy of such information and promptly update it as necessary;
— You have the legal capacity and agree to comply with these Legal Terms;
— You are not a minor in your jurisdiction, or if a minor, you have parental permission to use the Services;
— You will not access the Services through automated or non-human means except via our documented agent endpoints and only on behalf of a consenting human user;
— You will not use the Services for any illegal or unauthorized purpose;
— Your use will not violate any applicable law or regulation.`,
  },
  {
    title: "Purchases, points, and payouts",
    body: `Some Skills may be sold for virtual points within the marketplace. Pricing is shown before any transaction. By purchasing a Skill, you authorize the deduction of the corresponding points from your balance.

Skill Evo Marketplace retains a 15% platform fee on each Skill sale; the remaining 85% is credited to the author. Authors may request a cash-out of earned points subject to a minimum threshold and the conversion rate listed on the cash-out page.

Virtual points are non-refundable once spent. Cash-out requests are reviewed manually and may be declined for suspected fraud.`,
  },
  {
    title: "User contributions",
    body: `The Services let you publish Skills, post comments, rate Skills, and otherwise contribute content. Contributions are viewable by other users and may be syndicated through third-party clients (including AI agents acting on a user's behalf). Contributions are handled in accordance with the Privacy Policy.`,
  },
  {
    title: "Prohibited activities",
    body: `You may not:

— Systematically retrieve data from the Services to compile a database or directory without our written permission, beyond the rate limits in our published API documentation;
— Make any unauthorized use of the Services, including harvesting usernames or email addresses, or creating accounts by automated means or false pretenses;
— Use the Services to advertise or solicit unrelated goods and services;
— Publish Skills containing malware, exploits, credential stealers, or any code intended to harm users or systems;
— Misrepresent the authorship, origin, or function of a Skill you publish;
— Manipulate marketplace signals (ratings, installs, favorites) through fake accounts, paid endorsements, or collusion.`,
  },
  {
    title: "Limitation of liability",
    body: `In no event will we or our directors, employees, or agents be liable to you or any third party for any indirect, consequential, exemplary, incidental, special, or punitive damages — including lost profit, lost revenue, loss of data, or other damages — arising from your use of the Services, even if we have been advised of the possibility of such damages.`,
  },
  {
    title: "Termination",
    body: `We may terminate or suspend your access at any time, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Services will cease immediately. Public records you've created (published Skills, ratings, comments) may be retained in anonymized form to preserve marketplace integrity.`,
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight text-zinc-950 md:text-4xl dark:text-zinc-50">
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-zinc-500">Last updated: 2026-05-26</p>

      <div className="mt-10 space-y-2 border-l-2 border-zinc-200 pl-5 text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
        <p>
          <strong>Agreement to our legal terms.</strong> We are{" "}
          <strong>Skill Evo Marketplace</strong> (&quot;Company,&quot; &quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;). By accessing or using our services
          at{" "}
          <a
            href="https://evoskill.market"
            className="underline underline-offset-4 hover:text-zinc-950 dark:hover:text-zinc-100"
          >
            https://evoskill.market
          </a>
          , you agree to be bound by these terms. If you do not agree, discontinue
          use immediately.
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
