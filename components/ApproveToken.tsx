"use client";

/**
 * ApproveToken — calls an ERC-20's `approve(spender, amount)` on Sepolia.
 *
 * Web3 concepts for beginners:
 * - "Approval" lets another address (a "spender", often a DeFi contract) move a
 *   set amount of YOUR tokens on your behalf. It's how DEXes/lending protocols
 *   pull tokens when you trade/deposit. Approving does NOT move tokens itself.
 * - "Allowance" is the remaining amount a spender is still approved to move.
 * - This is a WRITE (state-changing) call, so it needs a signature + gas.
 *
 * Hooks:
 * - useReadContract(): reads the current allowance (owner → spender).
 * - useWriteContract(): submits the approve() transaction.
 * - useWaitForTransactionReceipt(): waits for it to be mined.
 */

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { isAddress, parseUnits, formatUnits, type Address } from "viem";
import {
  ERC20_ABI,
  SEPOLIA_CHAIN_ID,
  type WriteTokenConfig,
} from "@/lib/tokens.config";
import { parseTxError } from "@/lib/txError";
import { TxStatus, type TxLifecycle } from "./TxStatus";
import { useTxHistory, type TxRecord } from "@/lib/useTxHistory";

interface ApproveTokenProps {
  token: WriteTokenConfig;
  explorerUrl?: string;
  onRecord: (record: TxRecord) => void;
  onUpdate: (hash: `0x${string}`, status: TxRecord["status"]) => void;
}

export function ApproveToken({
  token,
  explorerUrl,
  onRecord,
  onUpdate,
}: ApproveTokenProps) {
  const { address } = useAccount();

  const [spender, setSpender] = useState("");
  const [amount, setAmount] = useState("");

  const spenderValid = isAddress(spender);
  const showSpenderError = spender.length > 0 && !spenderValid;

  // Parse the human amount into the token's base units (bigint).
  const parsedAmount = useMemo<bigint | undefined>(() => {
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) < 0) {
      return undefined;
    }
    try {
      return parseUnits(amount, token.decimals);
    } catch {
      return undefined;
    }
  }, [amount, token.decimals]);

  // ---- Read the current allowance for this owner → spender pair ----
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      address && spenderValid
        ? [address, spender as Address]
        : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: Boolean(address && spenderValid) },
  });

  // ---- Write: approve() ----
  const {
    data: hash,
    writeContract,
    isPending: isSigning,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: Boolean(hash) },
  });

  // Derive the lifecycle for TxStatus.
  const status: TxLifecycle = useMemo(() => {
    if (writeError || receiptError) return "error";
    if (isConfirmed) return "confirmed";
    if (isConfirming) return "confirming";
    if (isSigning || hash) return "pending";
    return "idle";
  }, [writeError, receiptError, isConfirmed, isConfirming, isSigning, hash]);

  const errorMessage = useMemo(
    () => (writeError || receiptError ? parseTxError(writeError ?? receiptError) : null),
    [writeError, receiptError],
  );

  // Record the tx in history when a hash appears, and keep its status synced.
  useEffect(() => {
    if (hash) {
      onRecord({
        hash,
        type: "approve",
        token: token.symbol,
        amount,
        counterparty: spender,
        status: "pending",
        chainId: SEPOLIA_CHAIN_ID,
        timestamp: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);

  useEffect(() => {
    if (!hash) return;
    if (isConfirmed) {
      onUpdate(hash, "confirmed");
      refetchAllowance();
    } else if (receiptError) {
      onUpdate(hash, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, receiptError, hash]);

  function handleApprove() {
    if (!spenderValid || parsedAmount === undefined) return;
    // Submit approve(spender, amount) — opens the wallet for signing.
    writeContract({
      address: token.address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender as Address, parsedAmount],
      chainId: SEPOLIA_CHAIN_ID,
    });
  }

  const canSubmit =
    spenderValid && parsedAmount !== undefined && status !== "pending" && status !== "confirming";

  const formattedAllowance =
    allowance !== undefined
      ? Number(formatUnits(allowance as bigint, token.decimals)).toLocaleString(
          "en-US",
          { maximumFractionDigits: 6 },
        )
      : null;

  return (
    <div className="space-y-4">
      {/* Current allowance readout */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-2.5">
        <span className="text-xs text-white/50">Current allowance</span>
        <span className="font-mono text-xs text-white/80">
          {spenderValid
            ? formattedAllowance !== null
              ? `${formattedAllowance} ${token.symbol}`
              : "…"
            : "Enter spender"}
        </span>
      </div>

      {/* Spender input */}
      <div className="space-y-1.5">
        <label htmlFor="spender" className="text-xs font-medium text-white/50">
          Spender address
        </label>
        <input
          id="spender"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="0x…"
          value={spender}
          onChange={(e) => setSpender(e.target.value.trim())}
          disabled={status === "pending" || status === "confirming"}
          className={[
            "w-full rounded-xl border bg-background/40 px-4 py-3 font-mono text-sm text-white placeholder:text-white/25 outline-none transition-colors disabled:opacity-60",
            showSpenderError ? "border-red-500/50 focus:border-red-500" : "border-border focus:border-accent",
          ].join(" ")}
        />
        {showSpenderError && (
          <p className="text-xs text-red-400">Invalid address.</p>
        )}
      </div>

      {/* Amount input */}
      <div className="space-y-1.5">
        <label htmlFor="approve-amount" className="text-xs font-medium text-white/50">
          Amount to approve
        </label>
        <div className="relative">
          <input
            id="approve-amount"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={status === "pending" || status === "confirming"}
            className="w-full rounded-xl border border-border bg-background/40 px-4 py-3 pr-16 font-mono text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-accent disabled:opacity-60"
          />
          <span className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-white/40">
            {token.symbol}
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleApprove}
        disabled={!canSubmit}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
      >
        Approve {token.symbol}
      </button>

      {/* Status */}
      <TxStatus
        status={status}
        hash={hash}
        errorMessage={errorMessage}
        explorerUrl={explorerUrl}
      />

      {(status === "confirmed" || status === "error") && (
        <button
          type="button"
          onClick={() => {
            reset();
            setAmount("");
          }}
          className="w-full text-center text-xs font-medium text-white/40 hover:text-white"
        >
          Reset
        </button>
      )}
    </div>
  );
}
