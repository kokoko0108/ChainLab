"use client";

/**
 * TokenBalances — check ERC-20 balances for any address on Ethereum mainnet.
 *
 * Web3 concepts for beginners:
 * - To read a token balance we call the token contract's `balanceOf(address)`.
 *   We also call `decimals()` to know how to format the raw integer result.
 * - "Multicall" batches many contract reads into ONE network request. Instead
 *   of 10 separate calls (5 tokens × 2 functions), wagmi's useReadContracts
 *   bundles them via the chain's Multicall3 contract — much faster and lighter.
 *
 * Hooks used (wagmi v2):
 * - useAccount(): to auto-fill the connected wallet's address.
 * - useReadContracts(): the multicall hook. We pass an array of {address, abi,
 *   functionName, args} "calls"; it returns an array of results in the same
 *   order, each with its own status/error so we can handle failures per token.
 */

import { useMemo, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { isAddress, formatUnits, type Address } from "viem";
import {
  ERC20_ABI,
  TOKEN_CHAINS,
  getTokenChain,
} from "@/lib/tokens.config";
import { TokenRow } from "./TokenRow";

export function TokenBalances() {
  const { address: connectedAddress, isConnected } = useAccount();

  // Which network's tokens we're checking (Ethereum ERC-20 vs BNB BEP-20).
  // Defaults to the first configured chain (Ethereum).
  const [selectedChainId, setSelectedChainId] = useState<number>(
    TOKEN_CHAINS[0].chainId,
  );
  const tokenChain = getTokenChain(selectedChainId);
  const TOKENS = tokenChain.tokens;

  // The address text in the input, and the address we've actually submitted to
  // look up. Separating them means typing doesn't refetch until "Check".
  const [input, setInput] = useState("");
  const [queryAddress, setQueryAddress] = useState<Address | undefined>();

  const inputIsValid = isAddress(input);
  const showInputError = input.length > 0 && !inputIsValid;

  /**
   * Build the multicall request: for EACH token, one `balanceOf` call and one
   * `decimals` call. The results array will be in the same order, so token i
   * occupies results[i*2] (balance) and results[i*2+1] (decimals).
   */
  const contracts = useMemo(() => {
    if (!queryAddress) return [];
    return TOKENS.flatMap((token) => [
      {
        address: token.address,
        abi: ERC20_ABI,
        functionName: "balanceOf" as const,
        args: [queryAddress] as const,
        chainId: selectedChainId,
      },
      {
        address: token.address,
        abi: ERC20_ABI,
        functionName: "decimals" as const,
        chainId: selectedChainId,
      },
    ]);
  }, [queryAddress, TOKENS, selectedChainId]);

  const {
    data: results,
    isLoading,
    isError,
    refetch,
  } = useReadContracts({
    contracts,
    // Don't fire until the user has submitted a valid address.
    query: { enabled: Boolean(queryAddress) },
  });

  /** Submit the input for lookup (the "Check" button / Enter key). */
  function handleCheck() {
    if (!inputIsValid) return;
    setQueryAddress(input as Address);
  }

  /** Auto-fill with the connected wallet address and look it up immediately. */
  function handleUseConnected() {
    if (!connectedAddress) return;
    setInput(connectedAddress);
    setQueryAddress(connectedAddress);
  }

  // Map raw multicall results into display rows. Each token reads two slots:
  // balance (i*2) and decimals (i*2+1). We format using the on-chain decimals,
  // falling back to the configured value if that read failed.
  const rows = useMemo(() => {
    return TOKENS.map((token, i) => {
      const balanceResult = results?.[i * 2];
      const decimalsResult = results?.[i * 2 + 1];

      // Per-token error: either read failing marks this row as errored.
      const rowError =
        balanceResult?.status === "failure" ||
        decimalsResult?.status === "failure";

      const rawBalance =
        balanceResult?.status === "success"
          ? (balanceResult.result as bigint)
          : undefined;

      const decimals =
        decimalsResult?.status === "success"
          ? Number(decimalsResult.result)
          : token.decimals; // fallback to config

      let formatted: string | null = null;
      if (rawBalance !== undefined) {
        // formatUnits turns the raw integer into a decimal string using the
        // token's decimals; we then trim to a sensible display precision.
        const value = Number(formatUnits(rawBalance, decimals));
        formatted =
          value === 0
            ? "0.00"
            : value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              });
      }

      return {
        token,
        balance: formatted,
        isLoading: isLoading && Boolean(queryAddress),
        isError: rowError,
      };
    });
  }, [results, isLoading, queryAddress, TOKENS]);

  // Whether every successfully-loaded token has a zero balance (empty state).
  const allZero =
    Boolean(queryAddress) &&
    !isLoading &&
    !isError &&
    rows.every((r) => r.balance === "0.00" || r.balance === null);

  /** Switch the network being checked, clearing any previous results. */
  function handleSelectChain(chainId: number) {
    if (chainId === selectedChainId) return;
    setSelectedChainId(chainId);
    setQueryAddress(undefined); // results are chain-specific; re-check needed
  }

  return (
    <div className="w-full space-y-5">
      {/* ---- Network toggle (Ethereum ERC-20 ⇄ BNB Chain BEP-20) ---- */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-white/50">Network</label>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-background/40 p-1">
          {TOKEN_CHAINS.map((c) => {
            const active = c.chainId === selectedChainId;
            return (
              <button
                key={c.chainId}
                type="button"
                onClick={() => handleSelectChain(c.chainId)}
                style={
                  active
                    ? {
                        backgroundColor: `${c.color}26`,
                        color: "#fff",
                        boxShadow: `inset 0 0 0 1px ${c.color}66`,
                      }
                    : undefined
                }
                className={[
                  "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  active ? "" : "text-white/50 hover:text-white",
                ].join(" ")}
              >
                {c.label}
                <span className="text-[10px] font-normal opacity-70">
                  {c.standard}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Address input ---- */}
      <div className="space-y-2">
        <label htmlFor="token-address" className="text-xs font-medium text-white/50">
          Wallet address
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="token-address"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="0x…"
            value={input}
            onChange={(e) => setInput(e.target.value.trim())}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            className={[
              "w-full rounded-xl border bg-background/40 px-4 py-3 font-mono text-sm text-white placeholder:text-white/25 outline-none transition-colors",
              showInputError
                ? "border-red-500/50 focus:border-red-500"
                : "border-border focus:border-accent",
            ].join(" ")}
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={!inputIsValid}
            className="shrink-0 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
          >
            Check
          </button>
        </div>

        <div className="flex items-center justify-between">
          {showInputError ? (
            <p className="text-xs text-red-400">Invalid Ethereum address.</p>
          ) : (
            <span />
          )}
          {isConnected && connectedAddress && (
            <button
              type="button"
              onClick={handleUseConnected}
              className="text-xs font-medium text-accent hover:underline"
            >
              Use connected wallet
            </button>
          )}
        </div>
      </div>

      {/* ---- Results ---- */}
      {!queryAddress ? (
        // Initial empty state before any lookup.
        <div className="rounded-xl border border-dashed border-border bg-background/20 px-4 py-10 text-center">
          <p className="text-sm text-white/40">
            Enter an address and press <span className="text-white/70">Check</span> to
            view token balances.
          </p>
        </div>
      ) : isError ? (
        // Whole-multicall failure (e.g. RPC down).
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-300">
            Failed to load balances. The RPC may be unavailable.
          </p>
          <button
            onClick={() => refetch()}
            className="text-xs font-medium text-red-300/80 hover:text-red-200"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Desktop header row (hidden on mobile where cards are used). */}
          <div className="hidden items-center justify-between px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-white/30 sm:flex">
            <span>Token</span>
            <span>Balance</span>
          </div>

          {/* On mobile: gap-2 card stack. On desktop: tight table rows. */}
          <div className="space-y-2 sm:space-y-0">
            {rows.map((row) => (
              <TokenRow key={row.token.address} {...row} />
            ))}
          </div>

          {/* Empty state when all balances are zero. */}
          {allZero && (
            <p className="pt-3 text-center text-sm text-white/40">
              This address holds none of the listed tokens.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
