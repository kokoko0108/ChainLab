"use client";

/**
 * Client-side provider tree.
 *
 * Web3 concepts for beginners:
 * - WagmiProvider: makes wagmi's React hooks (useAccount, useBalance, ...)
 *   available everywhere below it. It holds the wallet connection state.
 * - QueryClientProvider: wagmi v2 uses TanStack Query under the hood to cache
 *   and refetch on-chain data (like balances). This provider is REQUIRED.
 * - RainbowKitProvider: gives us the polished "Connect Wallet" modal UI and
 *   wallet/network management dialogs.
 *
 * This is a separate "use client" component because providers rely on React
 * context + browser APIs and therefore cannot live in a Server Component
 * (which is what app/layout.tsx is by default).
 */

import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  darkTheme,
  type Theme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

import { config } from "@/lib/wagmi.config";

// Customize RainbowKit's built-in dark theme to match our purple/navy palette.
const rainbowTheme: Theme = darkTheme({
  accentColor: "#7c5cff",
  accentColorForeground: "white",
  borderRadius: "large",
  overlayBlur: "small",
});

export function Providers({ children }: { children: ReactNode }) {
  // Create the QueryClient once per app instance. Using useState (instead of a
  // module-level const) ensures a fresh client per request during SSR and
  // avoids sharing cache between users on the server.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
