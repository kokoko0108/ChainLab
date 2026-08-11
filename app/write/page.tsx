"use client";

/**
 * Write to Smart Contract — approve / transfer ERC-20 tokens on Sepolia.
 *
 * Composition:
 * - A token selector (USDC/USDT/LINK/DAI) drives which contract the Approve and
 *   Transfer components act on.
 * - Tabs switch between Approve and Transfer.
 * - A transaction-history panel (last 5, persisted in localStorage) shows
 *   recent writes with status + Etherscan links.
 *
 * Safety: all writes target SEPOLIA testnet. If the wallet is on another chain
 * we prompt to switch, so we never accidentally write on mainnet.
 */

import { useState } from "react";
import Link from "next/link";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import {
  WRITE_TOKENS,
  SEPOLIA_CHAIN_ID,
} from "@/lib/tokens.config";
import { ApproveToken } from "@/components/ApproveToken";
import { TransferToken } from "@/components/TransferToken";
import { WalletButton } from "@/components/WalletButton";
import { useTxHistory } from "@/lib/useTxHistory";

const EXPLORER_URL = sepolia.blockExplorers.default.url;

type Tab = "approve" | "transfer";

export default function WritePage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [tokenIndex, setTokenIndex] = useState(0);
  const [tab, setTab] = useState<Tab>("approve");

  const token = WRITE_TOKENS[tokenIndex];
  const { records, addRecord, updateStatus } = useTxHistory();

  const onSepolia = chainId === SEPOLIA_CHAIN_ID;

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(124,92,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(124,92,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(55%_45%_at_50%_-5%,rgba(124,92,255,0.18),transparent_70%)]"
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to dashboard
        </Link>

        {/* Header */}
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent shadow-lg shadow-accent/30">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m18 13-6 6-6-6" />
              <path d="M12 19V5" />
              <path d="M5 5h14" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Write to Smart Contract
            </h1>
            <p className="text-sm text-white/50">
              Approve &amp; transfer ERC-20 tokens on Sepolia.
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          {/* Gate: must be connected and on Sepolia. */}
          {!isConnected ? (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <p className="text-sm text-white/50">
                Connect a wallet to write to contracts.
              </p>
              <WalletButton />
            </div>
          ) : !onSepolia ? (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/30">
                <svg className="h-6 w-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-white">
                  Switch to Sepolia
                </p>
                <p className="text-sm text-white/50">
                  Writes run on the Sepolia testnet for safe, free testing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => switchChain({ chainId: sepolia.id })}
                disabled={isSwitching}
                className="rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
              >
                {isSwitching ? "Switching…" : "Switch to Sepolia"}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Token selector */}
              <div className="space-y-1.5">
                <label htmlFor="token-select" className="text-xs font-medium text-white/50">
                  Token
                </label>
                <select
                  id="token-select"
                  value={tokenIndex}
                  onChange={(e) => setTokenIndex(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-border bg-background/40 px-4 py-3 text-sm font-medium text-white outline-none transition-colors focus:border-accent"
                >
                  {WRITE_TOKENS.map((t, i) => (
                    <option key={t.address} value={i} className="bg-card">
                      {t.symbol} — {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-background/40 p-1">
                {(["approve", "transfer"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-semibold capitalize transition-colors",
                      tab === t
                        ? "bg-accent/20 text-white ring-1 ring-accent/40"
                        : "text-white/50 hover:text-white",
                    ].join(" ")}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Active component — keyed by token so state resets on switch. */}
              {tab === "approve" ? (
                <ApproveToken
                  key={`approve-${token.address}`}
                  token={token}
                  explorerUrl={EXPLORER_URL}
                  onRecord={addRecord}
                  onUpdate={updateStatus}
                />
              ) : (
                <TransferToken
                  key={`transfer-${token.address}`}
                  token={token}
                  explorerUrl={EXPLORER_URL}
                  onRecord={addRecord}
                  onUpdate={updateStatus}
                />
              )}
            </div>
          )}
        </div>

        {/* Transaction history */}
        {records.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-card/80 p-5 shadow-2xl shadow-black/40 backdrop-blur">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">
              Recent transactions
            </p>
            <ul className="space-y-2">
              {records.map((r) => (
                <li
                  key={r.hash}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {/* Status dot */}
                    <span
                      className={[
                        "h-2 w-2 shrink-0 rounded-full",
                        r.status === "confirmed"
                          ? "bg-green-500"
                          : r.status === "error"
                            ? "bg-red-500"
                            : "animate-pulse bg-amber-400",
                      ].join(" ")}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize text-white">
                        {r.type}{" "}
                        <span className="font-mono text-white/70">
                          {r.amount} {r.token}
                        </span>
                      </p>
                      <p className="truncate font-mono text-[11px] text-white/30">
                        {r.hash}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`${EXPLORER_URL}/tx/${r.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[11px] font-medium text-accent hover:underline"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-white/30">
          Sepolia testnet · writes require test ETH for gas
        </p>
      </div>
    </main>
  );
}
