"use client";

/**
 * ConnectPrompt — shown inside wallet-dependent sections when no wallet is
 * connected, with the connect button so the user can act without leaving.
 */

import { WalletButton } from "@/components/WalletButton";

export function ConnectPrompt({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/30">
        <svg
          className="h-7 w-7 text-accent"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <circle cx="16" cy="14" r="1" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-white">Wallet required</p>
        <p className="text-sm text-white/50">
          Connect a wallet to {feature}.
        </p>
      </div>
      <WalletButton />
    </div>
  );
}
