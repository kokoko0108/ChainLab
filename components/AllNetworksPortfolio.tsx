"use client";

/**
 * AllNetworksPortfolio — aggregated holdings across every configured chain,
 * grouped by network. Each network section loads independently.
 */

import { useAccount } from "wagmi";
import { useAllNetworksPortfolio } from "@/lib/useAllNetworksPortfolio";
import { getChainMeta } from "@/lib/chainMeta";
import { TokenLogo } from "./TokenLogo";
import { Spinner } from "./Spinner";

export function AllNetworksPortfolio() {
  const { address, isConnected } = useAccount();
  const { networks, refetchAll } = useAllNetworksPortfolio(address);

  if (!isConnected || !address) return null;

  // Networks that have at least one holding, sorted by token count.
  const populated = networks
    .filter((n) => n.tokens.length > 0)
    .sort((a, b) => b.tokens.length - a.tokens.length);
  const stillLoading = networks.filter((n) => n.isLoading);
  const totalTokens = networks.reduce((sum, n) => sum + n.tokens.length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-white/40">
            All networks
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50">
            {totalTokens} asset{totalTokens === 1 ? "" : "s"}
          </span>
        </div>
        <button
          onClick={refetchAll}
          className="text-[11px] font-medium text-white/40 transition-colors hover:text-white"
        >
          Refresh
        </button>
      </div>

      {/* Network groups */}
      {populated.length === 0 && stillLoading.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background/20 px-4 py-10 text-center">
          <p className="text-sm text-white/40">
            No tokens found on any network.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {populated.map((net) => {
            const meta = getChainMeta(net.chainId);
            return (
              <div key={net.chainId} className="space-y-2">
                {/* Network header */}
                <div className="flex items-center gap-2 px-1">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-lg"
                    style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
                  >
                    <meta.Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {meta.label}
                  </span>
                  <span className="text-[11px] text-white/30">
                    {net.tokens.length} asset{net.tokens.length === 1 ? "" : "s"}
                  </span>
                </div>

                {/* Tokens */}
                <div className="space-y-1.5">
                  {net.tokens.map((t) => (
                    <div
                      key={`${net.chainId}-${t.address}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-2.5 transition-colors hover:border-white/15"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <TokenLogo
                          logo={t.logo}
                          symbol={t.symbol}
                          color={t.isNative ? meta.color : "#7c5cff"}
                          size={30}
                        />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                            {t.symbol}
                            {t.isNative && (
                              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-medium uppercase text-white/50">
                                Native
                              </span>
                            )}
                          </p>
                          <p className="truncate text-[11px] text-white/40">
                            {t.name}
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 font-mono text-sm font-semibold text-white">
                        {t.formatted}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Loading indicator for chains still in flight. */}
          {stillLoading.length > 0 && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background/30 px-4 py-3 text-xs text-white/40">
              <Spinner className="h-3.5 w-3.5" />
              Scanning {stillLoading.length} more network
              {stillLoading.length === 1 ? "" : "s"}…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
