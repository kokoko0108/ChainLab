"use client";

/**
 * Main page — composes the wallet UI.
 *
 * Layout logic:
 * - When NOT connected, we show a hero with the Connect Wallet button.
 * - When connected, we show the account card (WalletInfo), the
 *   NetworkSwitcher, and a Disconnect button (inside WalletButton).
 *
 * `useAccount()` drives which view is shown. The `mounted` guard prevents a
 * hydration mismatch, since wallet connection state only exists in the browser.
 */

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { WalletButton } from "@/components/WalletButton";
import { WalletInfo } from "@/components/WalletInfo";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { SendETH } from "@/components/SendETH";

export default function Home() {
  const { isConnected } = useAccount();

  // Avoid rendering connection-dependent UI until after hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Layered background: a faint on-chain grid + a soft radial glow that
          together read as "blockchain network" without being noisy. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(124,92,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(124,92,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(55%_45%_at_50%_-5%,rgba(124,92,255,0.18),transparent_70%)]"
      />

      {/* Container width adapts to state: a focused column when disconnected,
          a wide dashboard when connected so everything fits without scrolling. */}
      <div
        className={`relative z-10 w-full transition-[max-width] duration-300 ${
          mounted && isConnected ? "max-w-3xl" : "max-w-md"
        }`}
      >
        {/* Compact header. When connected it becomes a top bar: brand on the
            left, disconnect on the right. */}
        {mounted && isConnected ? (
          <header className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue to-accent shadow-lg shadow-accent/30">
                <svg
                  className="h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2 5.5 12.3 12 16l6.5-3.7L12 2Z" opacity="0.95" />
                  <path d="M12 17.2 5.5 13.5 12 22l6.5-8.5L12 17.2Z" opacity="0.6" />
                </svg>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Web3 Wallet
              </h1>
            </div>
            <WalletButton />
          </header>
        ) : (
          <header className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent shadow-lg shadow-accent/30">
              <svg
                className="h-6 w-6 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2 5.5 12.3 12 16l6.5-3.7L12 2Z" opacity="0.95" />
                <path d="M12 17.2 5.5 13.5 12 22l6.5-8.5L12 17.2Z" opacity="0.6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Web3 Wallet
            </h1>
            <p className="mt-1.5 text-sm text-white/50">
              Connect, view balances, and switch across 6 networks.
            </p>
          </header>
        )}

        {/* Main card */}
        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          {!mounted ? (
            // Placeholder during hydration to keep layout stable.
            <div className="flex h-40 items-center justify-center">
              <div className="h-6 w-6 animate-pulse rounded-full bg-accent/40" />
            </div>
          ) : !isConnected ? (
            // ---- INITIAL STATE ----
            <div className="flex flex-col items-center gap-6 py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/30">
                {/* Wallet icon */}
                <svg
                  className="h-8 w-8 text-accent"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H6a3 3 0 0 1-3-3" />
                  <circle cx="16" cy="13" r="1" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-white">
                  No wallet connected
                </p>
                <p className="text-sm text-white/50">
                  Connect a wallet to view balances and switch networks.
                </p>
              </div>
              <WalletButton />
            </div>
          ) : (
            // ---- CONNECTED STATE ----
            // Two-column dashboard on >=sm: account/balance on the left,
            // networks on the right. Stacks to one column on mobile.
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:divide-x sm:divide-border">
              <div className="sm:pr-6">
                <WalletInfo />
              </div>
              <div className="space-y-6 sm:pl-6">
                <NetworkSwitcher />
                <div className="border-t border-border pt-6">
                  <SendETH />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/30">
          Built with Next.js · wagmi v2 · viem · RainbowKit
        </p>
      </div>
    </main>
  );
}
