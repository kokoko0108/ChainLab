"use client";

/**
 * WalletInfo — shows the connected account's details.
 *
 * Web3 concepts for beginners:
 * - An "address" (0x...) is your public account identifier on the blockchain,
 *   like an account number. It's safe to share. We truncate it for display.
 * - A "balance" is how much of the native currency (ETH) the address holds.
 *   On-chain values are stored as huge integers in "wei" (1 ETH = 10^18 wei);
 *   viem/wagmi format that into a human-readable decimal string for us.
 * - A "chain id" uniquely identifies the network the wallet is currently on.
 *
 * Hooks used (wagmi v2):
 * - useAccount(): current address, connection status, and the active `chain`.
 *   NOTE: wagmi v1's `useNetwork()` was REMOVED in v2 — the active chain now
 *   comes from `useAccount()` (and/or `useChainId()`).
 * - useBalance(): fetches the native token balance for an address. It returns
 *   loading/error/refetch state because it's a network request under the hood.
 */

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { getChainMeta } from "@/lib/chainMeta";
import { Spinner } from "./Spinner";
import { Toast } from "./Toast";

// Helper: turn 0x1234abcd...5678 into 0x1234...5678 for compact display.
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletInfo() {
  // `address` is undefined until a wallet is connected.
  const { address, chain, isConnected } = useAccount();

  // Fetch the native balance for the connected address. `query.enabled`
  // prevents the request from firing before we have an address.
  const {
    data: balance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    refetch: refetchBalance,
  } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  });

  // Controls the "Copied!" toast notification + inline checkmark feedback.
  const [showCopied, setShowCopied] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  // Don't render anything until we actually have a connected account.
  if (!isConnected || !address) return null;

  // Brand metadata for the active chain (color, label, coin symbol).
  const meta = getChainMeta(chain?.id);

  // Build a block-explorer link for the address if the chain exposes one.
  const explorerUrl = chain?.blockExplorers?.default?.url
    ? `${chain.blockExplorers.default.url}/address/${address}`
    : undefined;

  /**
   * Copy the FULL address to the clipboard and show a toast.
   * Uses the async Clipboard API with a graceful fallback for older browsers
   * / non-secure contexts where navigator.clipboard is unavailable.
   */
  async function copyAddress() {
    if (!address) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(address);
      } else {
        // Fallback for http:// or older browsers.
        const textarea = document.createElement("textarea");
        textarea.value = address;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setShowCopied(true);
      // Briefly swap the copy icon for a checkmark for tactile feedback.
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  }

  // Format the balance to exactly 4 decimal places. `balance.formatted` is a
  // string like "1.23456789"; we parse + fix it for display.
  const formattedBalance = balance
    ? Number(balance.formatted).toFixed(4)
    : "0.0000";

  return (
    <div className="w-full space-y-5">
      {/* Top row: live status + active-network chip. */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="relative flex h-2.5 w-2.5">
            {/* Pulsing halo + solid dot to signal a live connection. */}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-green-400">
            Connected
          </span>
        </div>

        {/* Active network pill, tinted with the chain's brand color. */}
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ color: meta.color, backgroundColor: `${meta.color}1f` }}
        >
          <meta.Icon className="h-3.5 w-3.5" />
          {meta.label}
        </span>
      </div>

      {/* Hero balance — the focal point, with the coin symbol + USD-style
          monospace numerals (a convention crypto users expect). */}
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-background/40 p-5"
        style={{
          backgroundImage: `radial-gradient(120% 100% at 100% 0%, ${meta.color}1a, transparent 60%)`,
        }}
      >
        <p className="text-xs font-medium uppercase tracking-wider text-white/40">
          Total Balance
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          {isBalanceLoading ? (
            <span className="flex items-center gap-2 text-white/60">
              <Spinner className="text-white/60" />
              <span className="text-lg">Loading…</span>
            </span>
          ) : isBalanceError ? (
            <button
              onClick={() => refetchBalance()}
              className="flex items-center gap-1.5 text-sm text-red-300 underline-offset-2 hover:underline"
            >
              Failed to load — retry
            </button>
          ) : (
            <>
              <span className="font-mono text-4xl font-bold tracking-tight text-white">
                {formattedBalance}
              </span>
              <span
                className="text-base font-semibold"
                style={{ color: meta.color }}
              >
                {balance?.symbol ?? meta.symbol}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Address card — click to copy; opens explorer via the external link. */}
      <div className="rounded-xl border border-border bg-background/40">
        <button
          type="button"
          onClick={copyAddress}
          title="Click to copy full address"
          className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-white/[0.02]"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
              Wallet Address
            </p>
            <p className="mt-0.5 font-mono text-base text-white">
              {truncateAddress(address)}
            </p>
          </div>
          {/* Copy icon swaps to a green checkmark right after copying. */}
          {justCopied ? (
            <svg
              className="h-5 w-5 shrink-0 text-green-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 shrink-0 text-white/40 transition-colors group-hover:text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>

        {/* Explorer + chain id footer row. */}
        <div className="flex items-center justify-between border-t border-border/70 px-4 py-2">
          <span className="text-[11px] text-white/30">
            Chain ID {chain?.id ?? "—"}
          </span>
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-white/50 transition-colors hover:text-white"
            >
              View on explorer
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Copy-to-clipboard toast. Auto-hides after a short delay. */}
      <Toast
        show={showCopied}
        message="Address copied to clipboard!"
        onHide={() => setShowCopied(false)}
      />
    </div>
  );
}
