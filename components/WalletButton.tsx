"use client";

/**
 * WalletButton — handles the connect / disconnect flow.
 *
 * Web3 concepts for beginners:
 * - "Connecting a wallet" means asking a browser extension (MetaMask) or a
 *   mobile wallet (via WalletConnect) for permission to read your address and
 *   request signatures. We never see your private keys.
 * - An "injected connector" is a wallet that injects itself into the browser
 *   (window.ethereum), like MetaMask.
 * - "WalletConnect" is a protocol that connects mobile wallets by scanning a
 *   QR code.
 *
 * We use RainbowKit's <ConnectButton.Custom> render-prop so we get RainbowKit's
 * battle-tested modal (MetaMask + WalletConnect, QR codes, deep links) while
 * still rendering our OWN button styled with Tailwind. RainbowKit also handles
 * the common errors for us (user-rejected, wallet-not-installed) inside its
 * modal UI, so this stays simple and robust.
 *
 * When connected, this component shows a "Disconnect" button that calls
 * wagmi's useDisconnect() to cleanly return to the initial state.
 */

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useDisconnect } from "wagmi";
import { Spinner } from "./Spinner";

export function WalletButton() {
  // useDisconnect gives us an async-capable disconnect function. Calling it
  // clears the wagmi connection state and returns the UI to "not connected".
  const { disconnect, isPending: isDisconnecting } = useDisconnect();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openConnectModal,
        openChainModal,
        authenticationStatus,
        mounted,
      }) => {
        // `mounted` guards against hydration mismatches: wallet state only
        // exists in the browser, so we wait until the component is mounted.
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            // Hide from screen readers + pointer events until ready to avoid
            // flashing a stale state during hydration.
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              // ---- NOT CONNECTED ----
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-accent px-7 py-3.5 font-semibold text-white shadow-lg shadow-accent/25 transition-all duration-200 hover:bg-accent-hover hover:shadow-accent/40 active:scale-[0.98]"
                  >
                    {/* Wallet icon paired with the label for a clear,
                        recognizable call to action. */}
                    <svg
                      className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1H5a2 2 0 0 0-2 2V7Z" />
                      <path d="M3 10a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Z" />
                      <circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" />
                    </svg>
                    {/* RainbowKit shows its own spinner inside the modal while
                        connecting; here we just render the idle CTA. */}
                    Connect Wallet
                  </button>
                );
              }

              // ---- CONNECTED BUT WRONG / UNSUPPORTED NETWORK ----
              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/90 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-red-500 active:scale-[0.98]"
                  >
                    Wrong network — switch
                  </button>
                );
              }

              // ---- CONNECTED ----
              return (
                <button
                  onClick={() => disconnect()}
                  type="button"
                  disabled={isDisconnecting}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-red-300 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                >
                  {isDisconnecting ? (
                    <Spinner className="h-4 w-4 text-red-300" />
                  ) : (
                    // Logout / disconnect icon (door + exit arrow).
                    <svg
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="m16 17 5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                  )}
                  {isDisconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
