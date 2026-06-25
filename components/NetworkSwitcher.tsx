"use client";

/**
 * NetworkSwitcher — buttons to switch between Ethereum Mainnet and Base.
 *
 * Web3 concepts for beginners:
 * - "Switching networks" asks the wallet to change which chain it's pointed at.
 *   The wallet (MetaMask) will pop up a confirmation; the user can reject it.
 * - Each chain has a numeric id. We compare the active chain id to highlight
 *   the currently-selected network.
 *
 * Hooks used (wagmi v2):
 * - useChainId(): the id of the currently active chain (reactive).
 * - useSwitchChain(): provides `switchChain` to request a network change.
 *   NOTE: wagmi v1's `useSwitchNetwork()` was RENAMED to `useSwitchChain()`
 *   in v2, and its action is `switchChain({ chainId })` (not `switchNetwork`).
 *
 * Error handling: useSwitchChain exposes an `error` object. The most common
 * case is the user rejecting the wallet prompt; we surface a friendly message.
 */

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { supportedChains } from "@/lib/wagmi.config";
import { getChainMeta } from "@/lib/chainMeta";
import { Spinner } from "./Spinner";

export function NetworkSwitcher() {
  const { isConnected } = useAccount();
  const activeChainId = useChainId();
  const { switchChain, isPending, variables, error, reset } = useSwitchChain();

  // Local, dismissible error message derived from the hook's `error`.
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!error) {
      setErrorMessage(null);
      return;
    }
    // viem/wagmi errors expose a numeric `code`. 4001 = user rejected request.
    const code = (error as { code?: number }).code;
    if (code === 4001 || /reject/i.test(error.message)) {
      setErrorMessage("You rejected the network switch.");
    } else {
      // `shortMessage` is a concise, user-friendly string when available.
      const short = (error as { shortMessage?: string }).shortMessage;
      setErrorMessage(short ?? "Failed to switch network. Please try again.");
    }
  }, [error]);

  // Only show the switcher once a wallet is connected.
  if (!isConnected) return null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-white/40">
          Networks
        </p>
        <p className="text-[11px] text-white/30">
          {supportedChains.length} chains
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {supportedChains.map((chain) => {
          const isActive = chain.id === activeChainId;
          // Show a spinner on the specific button being switched to.
          const isSwitchingToThis =
            isPending && variables?.chainId === chain.id;
          const meta = getChainMeta(chain.id);

          return (
            <button
              key={chain.id}
              type="button"
              disabled={isActive || isPending}
              onClick={() => {
                reset(); // clear any previous error before trying again
                switchChain({ chainId: chain.id });
              }}
              // Each network is tinted with its own brand color so the active
              // chain is recognizable at a glance — a common pattern in
              // production wallet UIs.
              style={
                isActive
                  ? {
                      borderColor: `${meta.color}99`,
                      backgroundColor: `${meta.color}1f`,
                      boxShadow: `inset 0 0 0 1px ${meta.color}33, 0 4px 16px -8px ${meta.color}`,
                    }
                  : undefined
              }
              className={[
                "group relative flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border px-2 py-3 transition-all duration-200",
                isActive
                  ? "text-white"
                  : "border-border bg-background/40 text-white/70 hover:-translate-y-0.5 hover:border-white/20 hover:bg-background/70 hover:text-white",
                isPending && !isActive ? "opacity-50" : "",
                "disabled:cursor-default disabled:hover:translate-y-0",
              ].join(" ")}
            >
              {/* Brand-colored network icon badge. */}
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                style={{
                  color: meta.color,
                  backgroundColor: `${meta.color}1a`,
                }}
              >
                {isSwitchingToThis ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <meta.Icon className="h-4 w-4" />
                )}
              </span>
              <span className="text-xs font-semibold leading-none">
                {meta.label}
              </span>
              {/* Mark test networks so users know it's safe to experiment. */}
              {meta.testnet && (
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-medium uppercase leading-none tracking-wide text-white/50">
                  Testnet
                </span>
              )}
              {/* Tiny active marker dot pinned to the corner. */}
              {isActive && (
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Network-switch error message with a dismiss action. */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5">
          <p className="text-sm text-red-300">{errorMessage}</p>
          <button
            onClick={() => {
              reset();
              setErrorMessage(null);
            }}
            className="text-xs font-medium text-red-300/80 hover:text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
