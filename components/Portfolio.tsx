"use client";

/**
 * Portfolio — shows the connected wallet's full token holdings on the active
 * network: native coin + every ERC-20 (auto-discovered, or curated fallback).
 */

import { useAccount } from "wagmi";
import { usePortfolio } from "@/lib/usePortfolio";
import { getChainMeta } from "@/lib/chainMeta";
import { alchemySupports } from "@/lib/alchemy";
import { TokenLogo } from "./TokenLogo";
import { Spinner } from "./Spinner";

export function Portfolio() {
  const { address, chain, isConnected } = useAccount();
  const meta = getChainMeta(chain?.id);
  const { data: tokens, isLoading, isError, refetch } = usePortfolio(
    address,
    chain?.id,
  );

  if (!isConnected || !address) return null;

  const autoDiscovery = chain ? alchemySupports(chain.id) : false;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-white/40">
            Holdings
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ color: meta.color, backgroundColor: `${meta.color}1f` }}
          >
            {meta.label}
          </span>
        </div>
        <button
          onClick={() => refetch()}
          className="text-[11px] font-medium text-white/40 transition-colors hover:text-white"
        >
          Refresh
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3"
            >
              <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-2.5 w-28 animate-pulse rounded bg-white/5" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-300">Failed to load holdings.</p>
          <button
            onClick={() => refetch()}
            className="text-xs font-medium text-red-300/80 hover:text-red-200"
          >
            Retry
          </button>
        </div>
      ) : !tokens || tokens.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background/20 px-4 py-8 text-center">
          <p className="text-sm text-white/40">No tokens found on this network.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tokens.map((t) => (
            <div
              key={t.address}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 transition-colors hover:border-white/15"
            >
              <div className="flex min-w-0 items-center gap-3">
                <TokenLogo
                  logo={t.logo}
                  symbol={t.symbol}
                  color={t.isNative ? meta.color : "#7c5cff"}
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold text-white">
                    {t.symbol}
                    {t.isNative && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-medium uppercase text-white/50">
                        Native
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-white/40">{t.name}</p>
                </div>
              </div>
              <p className="shrink-0 font-mono text-sm font-semibold text-white">
                {t.formatted}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Discovery mode hint */}
      <p className="text-center text-[11px] text-white/25">
        {autoDiscovery
          ? "Auto-discovering all tokens via Alchemy"
          : "Showing curated tokens — add an Alchemy API key for full auto-discovery"}
      </p>
    </div>
  );
}
