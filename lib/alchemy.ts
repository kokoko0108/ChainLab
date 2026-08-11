/**
 * Alchemy token-discovery helpers.
 *
 * Alchemy's enhanced JSON-RPC lets us list EVERY ERC-20 a wallet holds on a
 * chain in one call (`alchemy_getTokenBalances`), then fetch each token's
 * metadata (name/symbol/decimals/logo). This is what powers "any token across
 * any network" without hardcoding token lists.
 *
 * The API key is read from NEXT_PUBLIC_ALCHEMY_API_KEY. If it's absent, callers
 * should fall back to the curated token lists so the app still works.
 */

import type { Address } from "viem";

// Map our supported chainIds to Alchemy network subdomains.
const ALCHEMY_NETWORK: Record<number, string> = {
  1: "eth-mainnet",
  8453: "base-mainnet",
  137: "polygon-mainnet",
  42161: "arb-mainnet",
  10: "opt-mainnet",
  56: "bnb-mainnet",
  11155111: "eth-sepolia",
};

export const ALCHEMY_API_KEY =
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? "";

/** Whether auto-discovery is available (key present + chain supported). */
export function alchemySupports(chainId: number): boolean {
  return Boolean(ALCHEMY_API_KEY) && chainId in ALCHEMY_NETWORK;
}

function endpoint(chainId: number): string | null {
  const net = ALCHEMY_NETWORK[chainId];
  if (!net || !ALCHEMY_API_KEY) return null;
  return `https://${net}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
}

async function rpc<T>(
  chainId: number,
  method: string,
  params: unknown[],
): Promise<T> {
  const url = endpoint(chainId);
  if (!url) throw new Error("Alchemy not configured for this chain");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Alchemy HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? "Alchemy RPC error");
  return json.result as T;
}

export interface RawTokenBalance {
  contractAddress: Address;
  tokenBalance: string; // hex
}

/** List all non-zero ERC-20 balances an address holds on the chain. */
export async function getTokenBalances(
  chainId: number,
  address: Address,
): Promise<RawTokenBalance[]> {
  const result = await rpc<{ tokenBalances: RawTokenBalance[] }>(
    chainId,
    "alchemy_getTokenBalances",
    [address, "erc20"],
  );
  // Filter out zero balances (Alchemy returns 0x0...0 for many).
  return result.tokenBalances.filter(
    (t) => t.tokenBalance && BigInt(t.tokenBalance) > 0n,
  );
}

export interface TokenMetadata {
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  logo: string | null;
}

/** Fetch metadata (name/symbol/decimals/logo) for one token contract. */
export async function getTokenMetadata(
  chainId: number,
  contractAddress: Address,
): Promise<TokenMetadata> {
  return rpc<TokenMetadata>(chainId, "alchemy_getTokenMetadata", [
    contractAddress,
  ]);
}
