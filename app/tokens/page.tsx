"use client";

/**
 * Token Balance Checker page.
 *
 * Reuses the app's dark theme + layered background. Lets the user look up
 * ERC-20 balances for any address on Ethereum mainnet via a single multicall.
 */

import Link from "next/link";
import { TokenBalances } from "@/components/TokenBalances";

export default function TokensPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Layered background: faint on-chain grid + soft radial glow. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(124,92,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(124,92,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(55%_45%_at_50%_-5%,rgba(124,92,255,0.18),transparent_70%)]"
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Back link to the main wallet page. */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to wallet
        </Link>

        {/* Header */}
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent shadow-lg shadow-accent/30">
            <svg
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.2c0 1.8-2.5 2-2.5 3.3" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Token Balance Checker
            </h1>
            <p className="text-sm text-white/50">
              ERC-20 &amp; BEP-20 balances on Ethereum and BNB Chain.
            </p>
          </div>
        </header>

        {/* Main card */}
        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          <TokenBalances />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/30">
          Balances read via Multicall3 · Ethereum &amp; BNB Chain
        </p>
      </div>
    </main>
  );
}
