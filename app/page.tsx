"use client";

/**
 * Admin-style dashboard — single entry point for all wallet functions.
 *
 * Layout:
 * - A persistent sidebar (left on desktop, top scroll-bar on mobile) lets the
 *   user navigate between sections: Overview, Send, Networks, Tokens.
 * - A topbar shows the app brand + live connection status / connect button.
 * - The main area renders the active section, reusing the existing feature
 *   components (Portfolio, SendToken, ReceiveToken, NetworkSwitcher, …).
 *
 * Section state is local (no routing) so switching is instant. `mounted` guards
 * against hydration mismatch since wallet state is browser-only.
 */

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { WalletButton } from "@/components/WalletButton";
import { WalletInfo } from "@/components/WalletInfo";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { SendToken } from "@/components/SendToken";
import { ReceiveToken } from "@/components/ReceiveToken";
import { Portfolio } from "@/components/Portfolio";
import { AllNetworksPortfolio } from "@/components/AllNetworksPortfolio";
import { TokenBalances } from "@/components/TokenBalances";
import { Sidebar, NAV_ITEMS, type SectionId } from "@/components/admin/Sidebar";
import { Panel } from "@/components/admin/Panel";
import { ConnectPrompt } from "@/components/admin/ConnectPrompt";
import { getChainMeta } from "@/lib/chainMeta";

export default function Dashboard() {
  const { isConnected, chain } = useAccount();
  const [active, setActive] = useState<SectionId>("overview");
  // Portfolio scope: just the active chain, or aggregated across all networks.
  const [portfolioScope, setPortfolioScope] = useState<"current" | "all">("all");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const meta = getChainMeta(chain?.id);
  const activeItem = NAV_ITEMS.find((i) => i.id === active)!;

  // For wallet-dependent sections, show the connect prompt when disconnected.
  const needsConnect =
    mounted && activeItem.requiresWallet && !isConnected;

  return (
    <main className="relative min-h-screen bg-background">
      {/* Layered background. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(124,92,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(124,92,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(50%_40%_at_50%_-5%,rgba(124,92,255,0.16),transparent_70%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:flex-row md:gap-6 md:py-8">
        {/* ---- Sidebar ---- */}
        <aside className="mb-4 md:mb-0 md:w-64 md:shrink-0">
          {/* Brand */}
          <div className="mb-6 flex items-center gap-3 px-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue to-accent shadow-lg shadow-accent/30">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2 5.5 12.3 12 16l6.5-3.7L12 2Z" opacity="0.95" />
                <path d="M12 17.2 5.5 13.5 12 22l6.5-8.5L12 17.2Z" opacity="0.6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-white">
                Web3 Wallet
              </p>
              <p className="text-[11px] text-white/40">Dashboard</p>
            </div>
          </div>

          <Sidebar active={active} onSelect={setActive} />
        </aside>

        {/* ---- Main content ---- */}
        <div className="flex-1">
          {/* Topbar: section title + connection status. */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {activeItem.label}
              </h1>
              <p className="text-sm text-white/40">{activeItem.description}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Live connection chip. */}
              {mounted && isConnected && (
                <span
                  className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex"
                  style={{ color: meta.color, backgroundColor: `${meta.color}1f` }}
                >
                  <meta.Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
              )}
              <WalletButton />
            </div>
          </div>

          {/* Section body. */}
          {!mounted ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-card/80">
              <div className="h-6 w-6 animate-pulse rounded-full bg-accent/40" />
            </div>
          ) : needsConnect ? (
            <Panel title={activeItem.label} subtitle={activeItem.description}>
              <ConnectPrompt feature={activeItem.description.toLowerCase()} />
            </Panel>
          ) : active === "overview" ? (
            <div className="space-y-4">
              <Panel title="Account" subtitle="Your wallet at a glance">
                <WalletInfo />
              </Panel>
              <Panel
                title="Portfolio"
                subtitle={
                  portfolioScope === "all"
                    ? "Every token you hold, across all networks"
                    : "Every token you hold on the active network"
                }
              >
                {/* Scope toggle: current chain vs. all networks. */}
                <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-background/40 p-1">
                  {(["all", "current"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPortfolioScope(s)}
                      className={[
                        "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                        portfolioScope === s
                          ? "bg-accent/20 text-white ring-1 ring-accent/40"
                          : "text-white/50 hover:text-white",
                      ].join(" ")}
                    >
                      {s === "all" ? "All networks" : "This network"}
                    </button>
                  ))}
                </div>
                {portfolioScope === "all" ? (
                  <AllNetworksPortfolio />
                ) : (
                  <Portfolio />
                )}
              </Panel>
            </div>
          ) : active === "send" ? (
            <Panel
              title="Send"
              subtitle="Send any token — native coin or ERC-20"
            >
              <SendToken />
            </Panel>
          ) : active === "receive" ? (
            <Panel
              title="Receive"
              subtitle="Share your address to receive any token"
            >
              <ReceiveToken />
            </Panel>
          ) : active === "networks" ? (
            <Panel
              title="Networks"
              subtitle="Switch the active chain in your wallet"
            >
              <NetworkSwitcher />
            </Panel>
          ) : (
            <Panel
              title="Token Balance Checker"
              subtitle="Look up balances for any address"
            >
              <TokenBalances />
            </Panel>
          )}

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-white/30 md:text-left">
            Built with Next.js · wagmi v2 · viem · RainbowKit
          </p>
        </div>
      </div>
    </main>
  );
}
