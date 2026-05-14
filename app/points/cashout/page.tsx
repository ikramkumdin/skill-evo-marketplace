import { CashoutClient } from "./cashout-client";

export const dynamic = "force-dynamic";

export default function CashoutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Cash Out
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Convert your earned points to real money. Authors keep 85% of each Skill
          sale; the remaining 15% is the platform fee.
        </p>
      </div>

      <CashoutClient />

      <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
        <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          How payouts work
        </h2>
        <ul className="space-y-1.5 list-disc pl-5">
          <li>Conversion rate: <strong>100 points = $1.00 USD</strong></li>
          <li>Minimum payout: 1,000 points ($10)</li>
          <li>Payouts are reviewed manually and processed within 5 business days</li>
          <li>Points are locked the moment you submit the request</li>
          <li>Rejected requests refund your points back to your balance</li>
        </ul>
      </div>
    </div>
  );
}
