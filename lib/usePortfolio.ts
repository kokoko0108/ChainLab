"use client";

/**
 * usePortfolio — fetches a wallet's full token portfolio on a given chain:
 *   1. The native coin balance (ETH/POL/BNB…).
 *   2. Every ERC-20 the address holds, via Alchemy auto-discovery.
 *
 * If no Alchemy key is configured (or the chain is unsupported), it gracefully
 * falls back to the chain's curated token list, reading balances on-chain via
 * the public client. Either way the UI gets a uniform `PortfolioToken[]`.
 */

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { formatUnits, type Address } from "viem";
import {
  alchemySupports,
  getTokenBalances,
  getTokenMetadata,
} from "@/lib/alchemy";
import { ERC20_ABI, getTokenChain } from "@/lib/tokens.config";

export interface PortfolioToken {
  address: Address | "native";
  symbol: string;
  name: string;
  decimals: number;
  /** Raw on-chain balance in base units. */
  raw: bigint;
  /** Human-formatted balance string. */
  formatted: string;
  logo: string | null;
  isNative: boolean;
}

function fmt(raw: bigint, decimals: number): string {
  const value = Number(formatUnits(raw, decimals));
  if (value === 0) return "0";
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

// A viem public client (typed loosely to avoid importing viem's heavy generics).
type AnyPublicClient = NonNullable<ReturnType<typeof usePublicClient>>;

/**
 * Core fetch: native balance + all ERC-20s for one address on one chain.
 * Shared by both the single-chain and all-networks hooks.
 */
export async function fetchPortfolio(
  publicClient: AnyPublicClient,
  address: Address,
  chainId: number,
): Promise<PortfolioToken[]> {
  const tokens: PortfolioToken[] = [];

  // ---- 1. Native coin balance ----
  const nativeBalance = await publicClient.getBalance({ address });
  const nativeCurrency = publicClient.chain?.nativeCurrency;
  tokens.push({
    address: "native",
    symbol: nativeCurrency?.symbol ?? "ETH",
    name: nativeCurrency?.name ?? "Ether",
    decimals: nativeCurrency?.decimals ?? 18,
    raw: nativeBalance,
    formatted: fmt(nativeBalance, nativeCurrency?.decimals ?? 18),
    logo: null,
    isNative: true,
  });

  // ---- 2. ERC-20 tokens ----
  if (alchemySupports(chainId)) {
    // Auto-discovery path.
    const balances = await getTokenBalances(chainId, address);
    const top = balances.slice(0, 30);
    const metas = await Promise.all(
      top.map((b) =>
        getTokenMetadata(chainId, b.contractAddress).catch(() => null),
      ),
    );
    top.forEach((b, i) => {
      const meta = metas[i];
      if (!meta || meta.decimals == null || !meta.symbol) return;
      const raw = BigInt(b.tokenBalance);
      tokens.push({
        address: b.contractAddress,
        symbol: meta.symbol,
        name: meta.name ?? meta.symbol,
        decimals: meta.decimals,
        raw,
        formatted: fmt(raw, meta.decimals),
        logo: meta.logo,
        isNative: false,
      });
    });
  } else {
    // Fallback: read curated list balances on-chain via multicall.
    const chain = getTokenChain(chainId);
    const results = await publicClient.multicall({
      contracts: chain.tokens.map((t) => ({
        address: t.address,
        abi: ERC20_ABI,
        functionName: "balanceOf" as const,
        args: [address],
      })),
    });
    chain.tokens.forEach((t, i) => {
      const r = results[i];
      if (r.status !== "success") return;
      const raw = r.result as bigint;
      if (raw === 0n) return;
      tokens.push({
        address: t.address,
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
        raw,
        formatted: fmt(raw, t.decimals),
        logo: t.logo,
        isNative: false,
      });
    });
  }

  return tokens;
}

/** Single-chain portfolio for the active network. */
export function usePortfolio(
  address: Address | undefined,
  chainId: number | undefined,
) {
  const publicClient = usePublicClient({ chainId });

  return useQuery({
    queryKey: ["portfolio", chainId, address],
    enabled: Boolean(address && chainId && publicClient),
    staleTime: 15_000,
    queryFn: () => fetchPortfolio(publicClient!, address!, chainId!),
  });
}
