"use client";

import { useState } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInButtons } from "@/components/sign-in-buttons";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function CashoutClient() {
  if (!isConvexConfigured) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500">Cash out requires backend to be configured.</p>
      </div>
    );
  }
  return <Connected />;
}

function Connected() {
  const { isAuthenticated } = useConvexAuth();
  const info = useQuery(api.points.payoutInfo);
  const payouts = useQuery(api.points.myPayouts) ?? [];
  const requestPayout = useMutation(api.points.requestPayout);

  const [points, setPoints] = useState("");
  const [method, setMethod] = useState<"paypal" | "stripe-connect" | "wire">("paypal");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-3xl mb-2">💰</p>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
          Sign in to cash out your points
        </p>
        <div className="mx-auto max-w-xs">
          <SignInButtons redirectTo="/points/cashout" />
        </div>
      </div>
    );
  }

  if (!info) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  const pointsNum = parseInt(points, 10) || 0;
  const usd = pointsNum / info.pointsPerUsd;
  const belowMin = pointsNum > 0 && pointsNum < info.minPayoutPoints;
  const overBalance = pointsNum > info.balance;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const result = await requestPayout({
        pointsAmount: pointsNum,
        payoutMethod: method,
        payoutDestination: destination.trim(),
      });
      setSuccess(`Payout request created for $${result.amountUsd.toFixed(2)}.`);
      setPoints("");
      setDestination("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payout failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Available balance</p>
            <p className="mt-1 text-3xl font-bold text-zinc-950 dark:text-zinc-50 tabular-nums">
              ⭐ {info.balance.toLocaleString()} pts
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              ≈ ${info.maxPayoutUsd.toFixed(2)} USD
            </p>
          </div>
          <Link
            href="/me"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            View profile →
          </Link>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
      >
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Request a payout
        </h2>

        <Field
          label="Points to cash out"
          hint={`Min ${info.minPayoutPoints.toLocaleString()} pts. ${info.pointsPerUsd} pts = $1.`}
        >
          <input
            type="number"
            min={info.minPayoutPoints}
            max={info.balance}
            step={100}
            required
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="1000"
            className={inputCls}
          />
          {pointsNum > 0 && (
            <p className="mt-1 text-xs text-zinc-500">
              You&apos;ll receive{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                ${usd.toFixed(2)}
              </span>
              {belowMin && (
                <span className="text-red-500">
                  {" "}— below minimum {info.minPayoutPoints} pts
                </span>
              )}
              {overBalance && (
                <span className="text-red-500"> — exceeds your balance</span>
              )}
            </p>
          )}
        </Field>

        <Field label="Payout method" hint="How you'd like to receive the money.">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className={inputCls}
          >
            <option value="paypal">PayPal</option>
            <option value="stripe-connect">Stripe Connect</option>
            <option value="wire">Bank wire</option>
          </select>
        </Field>

        <Field
          label={
            method === "paypal"
              ? "PayPal email"
              : method === "wire"
                ? "Bank account details"
                : "Stripe Connect account email"
          }
          hint="We'll use this to send your payout."
        >
          <input
            type="text"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={method === "paypal" ? "you@example.com" : "Account reference"}
            className={inputCls}
          />
        </Field>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || belowMin || overBalance || pointsNum < info.minPayoutPoints}
          className="h-10 w-full rounded-lg bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "Submitting…" : "Request Payout"}
        </button>
      </form>

      {/* Past payouts */}
      {payouts.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Payout history
          </h2>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {payouts.map((p) => (
              <li key={p._id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    ${p.amountUsd.toFixed(2)} ({p.pointsAmount.toLocaleString()} pts)
                  </p>
                  <p className="text-xs text-zinc-500">
                    {p.payoutMethod} · {new Date(p._creationTime).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "paid" | "rejected" }) {
  const map = {
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    approved: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    rejected: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[status]}`}>
      {status}
    </span>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";
