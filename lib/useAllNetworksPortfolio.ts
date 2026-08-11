"use client";

/**
 * useAllNetworksPortfolio — fetches the wallet's holdings on EVERY configured
 * chain in parallel, so the user sees everything they own across all networks
 * in one view.
 *
 * Each chain is its own React Query, so a slow or failing network doesn't block
 * the others — each network card can show its own loading / error / data state.
 */

import { useQueries } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import type { Address } from "viem";
import { supportedChains } from "@/lib/wagmi.config";
import { fetchPortfolio, type PortfolioToken } from "@/lib/usePortfolio";

export interface NetworkPortfolio {
  chainId: number;
  tokens: PortfolioToken[];
  isLoading: boolean;
  isError: boolean;
}

export function useAllNetworksPortfolio(address: Address | undefined) {
  const config = useConfig();

  const results = useQueries({
    queries: supportedChains.map((chain) => ({
      queryKey: ["portfolio-all", chain.id, address],
      enabled: Boolean(address),
      staleTime: 30_000,
      queryFn: async (): Promise<PortfolioToken[]> => {
        if (!address) return [];
        // Resolve a public client for THIS chain from the wagmi config.
        const publicClient = getPublicClient(config, { chainId: chain.id });
        if (!publicClient) return [];
        return fetchPortfolio(publicClient, address, chain.id);
      },
    })),
  });

  // Zip results back to their chains for the UI.
  const networks: NetworkPortfolio[] = supportedChains.map((chain, i) => ({
    chainId: chain.id,
    tokens: results[i].data ?? [],
    isLoading: results[i].isLoading,
    isError: results[i].isError,
  }));

  const isLoading = results.some((r) => r.isLoading);
  const refetchAll = () => results.forEach((r) => r.refetch());

  return { networks, isLoading, refetchAll };
}
