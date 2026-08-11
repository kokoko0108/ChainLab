"use client";

/**
 * TokenRow — renders a single token's logo, name, and balance.
 *
 * Responsive by design: it's styled to work both as a table row (desktop, where
 * the parent uses a table-like grid) and as a standalone card (mobile). The
 * parent decides the wrapping; this component just lays out the three pieces of
 * info plus loading / error states.
 */

import { useState } from "react";
import type { TokenConfig } from "@/lib/tokens.config";

export interface TokenRowData {
  token: TokenConfig;
  /** Human-formatted balance string, or null while loading. */
  balance: string | null;
  isLoading: boolean;
  isError: boolean;
}

export function TokenRow({ token, balance, isLoading, isError }: TokenRowData) {
  // Some TrustWallet logos 404 (or are blocked); fall back to a lettered avatar.
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 transition-colors hover:border-white/15 sm:rounded-none sm:border-0 sm:border-b sm:border-border/60 sm:bg-transparent sm:px-2 sm:hover:bg-white/[0.02]">
      {/* Left: logo + symbol/name */}
      <div className="flex min-w-0 items-center gap-3">
        {logoFailed ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
            {token.symbol.slice(0, 3)}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={token.logo}
            alt={`${token.symbol} logo`}
            width={36}
            height={36}
            loading="lazy"
            onError={() => setLogoFailed(true)}
            className="h-9 w-9 shrink-0 rounded-full bg-white/5"
          />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-white">{token.symbol}</p>
          <p className="truncate text-xs text-white/40">{token.name}</p>
        </div>
      </div>

      {/* Right: balance / skeleton / error */}
      <div className="text-right">
        {isLoading ? (
          // Loading skeleton bar.
          <div className="ml-auto h-5 w-20 animate-pulse rounded bg-white/10" />
        ) : isError ? (
          <span className="text-sm text-red-400">Error</span>
        ) : (
          <p className="font-mono text-base font-semibold text-white">
            {balance ?? "0.00"}
          </p>
        )}
      </div>
    </div>
  );
}
