"use client";

/**
 * wagmi + chain configuration.
 *
 * Web3 concepts for beginners:
 * - A "chain" is a specific blockchain network (e.g. Ethereum Mainnet, Base).
 *   Each has a unique numeric `chainId` (Mainnet = 1, Base = 8453).
 * - A "transport" is HOW we read data from a chain. `http()` uses a JSON-RPC
 *   endpoint over HTTPS. Without a custom RPC URL, viem falls back to a public
 *   default endpoint for the chain.
 * - A "connector" is a way to connect a wallet (MetaMask, WalletConnect, etc.).
 *   RainbowKit sets these up for us via `getDefaultConfig`.
 */

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  mainnet,
  base,
  polygon,
  arbitrum,
  optimism,
  bsc,
  sepolia,
} from "wagmi/chains";
import { http } from "wagmi";

// WalletConnect requires a project ID. We read it from an env var so the
// secret stays out of source control. If it's missing we fall back to a
// clearly-fake placeholder so the app still boots (injected wallets work,
// WalletConnect simply won't until a real ID is provided).
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID";

export const config = getDefaultConfig({
  appName: "Web3 Wallet App",
  projectId,
  // The chains our app supports. The first one is the default chain.
  // Each chain has its own native coin, shown automatically by useBalance:
  //   mainnet → ETH, base → ETH, polygon → POL, arbitrum → ETH,
  //   optimism → ETH, bsc → BNB.
  // `sepolia` is Ethereum's test network: its ETH has no real value and can be
  // claimed for free from a faucet, making it safe for testing real sends.
  chains: [mainnet, base, polygon, arbitrum, optimism, bsc, sepolia],
  // Per-chain RPC transport.
  //
  // IMPORTANT: a bare `http()` uses viem's DEFAULT public RPC, which is heavily
  // rate-limited and often unreachable from the browser — that's what causes
  // "Balance: Failed to load". We instead point at reliable public endpoints
  // (publicnode), overridable via env vars so you can drop in your own
  // Alchemy/Infura URL in production without code changes.
  transports: {
    [mainnet.id]: http(
      process.env.NEXT_PUBLIC_MAINNET_RPC_URL ??
        "https://ethereum-rpc.publicnode.com",
    ),
    [base.id]: http(
      process.env.NEXT_PUBLIC_BASE_RPC_URL ??
        "https://base-rpc.publicnode.com",
    ),
    [polygon.id]: http(
      process.env.NEXT_PUBLIC_POLYGON_RPC_URL ??
        "https://polygon-bor-rpc.publicnode.com",
    ),
    [arbitrum.id]: http(
      process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ??
        "https://arbitrum-one-rpc.publicnode.com",
    ),
    [optimism.id]: http(
      process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL ??
        "https://optimism-rpc.publicnode.com",
    ),
    [bsc.id]: http(
      process.env.NEXT_PUBLIC_BSC_RPC_URL ??
        "https://bsc-rpc.publicnode.com",
    ),
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
        "https://ethereum-sepolia-rpc.publicnode.com",
    ),
  },
  // Required for Next.js App Router: tells wagmi we run in an SSR environment
  // so it doesn't try to access browser-only APIs during server rendering.
  ssr: true,
});

// Re-export the supported chains so other components can reference them
// (e.g. the NetworkSwitcher) without re-importing from wagmi/chains.
export const supportedChains = [
  mainnet,
  base,
  polygon,
  arbitrum,
  optimism,
  bsc,
  sepolia,
] as const;
