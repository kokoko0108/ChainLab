"use client";

/**
 * TransferToken — calls an ERC-20's `transfer(to, amount)` on Sepolia.
 *
 * Web3 concepts for beginners:
 * - `transfer` moves tokens directly from YOU to another address. Unlike
 *   approve (which only authorizes), this actually changes balances.
 * - We validate the recipient (isAddress) and that you hold enough tokens
 *   BEFORE sending, to avoid a guaranteed revert that still costs gas.
 * - Gas (the network fee) is paid in ETH, separate from the token being sent.
 *
 * Hooks:
 * - useReadContract(): reads your token balance for the validity check.
 * - useEstimateGas() + useEstimateFeesPerGas(): estimate the gas fee.
 * - useWriteContract() + useWaitForTransactionReceipt(): send + await mine.
 */

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useEstimateFeesPerGas,
} from "wagmi";
import {
  isAddress,
  parseUnits,
  formatUnits,
  formatEther,
  encodeFunctionData,
  type Address,
} from "viem";
import { useEstimateGas } from "wagmi";
import {
  ERC20_ABI,
  SEPOLIA_CHAIN_ID,
  type WriteTokenConfig,
} from "@/lib/tokens.config";
import { parseTxError } from "@/lib/txError";
import { TxStatus, type TxLifecycle } from "./TxStatus";
import type { TxRecord } from "@/lib/useTxHistory";

interface TransferTokenProps {
  token: WriteTokenConfig;
  explorerUrl?: string;
  onRecord: (record: TxRecord) => void;
  onUpdate: (hash: `0x${string}`, status: TxRecord["status"]) => void;
}

export function TransferToken({
  token,
  explorerUrl,
  onRecord,
  onUpdate,
}: TransferTokenProps) {
  const { address } = useAccount();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const recipientValid = isAddress(recipient);
  const showRecipientError = recipient.length > 0 && !recipientValid;

  const parsedAmount = useMemo<bigint | undefined>(() => {
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return undefined;
    }
    try {
      return parseUnits(amount, token.decimals);
    } catch {
      return undefined;
    }
  }, [amount, token.decimals]);

  // ---- Read the sender's token balance for the sufficiency check ----
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: Boolean(address) },
  });

  const tokenBalance = (balance as bigint | undefined) ?? undefined;
  const insufficientBalance =
    tokenBalance !== undefined &&
    parsedAmount !== undefined &&
    parsedAmount > tokenBalance;

  const txReady = recipientValid && parsedAmount !== undefined && !insufficientBalance;

  // ---- Gas estimation ----
  // We encode the transfer() calldata and estimate gas for sending it to the
  // token contract, then multiply by the per-gas fee.
  const calldata = useMemo(() => {
    if (!recipientValid || parsedAmount === undefined) return undefined;
    return encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient as Address, parsedAmount],
    });
  }, [recipientValid, recipient, parsedAmount]);

  const { data: gasLimit } = useEstimateGas({
    to: token.address,
    data: calldata,
    account: address,
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: Boolean(txReady && calldata && address) },
  });
  const { data: fees } = useEstimateFeesPerGas({
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: Boolean(txReady) },
  });

  const estimatedFeeWei = useMemo<bigint | undefined>(() => {
    if (gasLimit === undefined || !fees) return undefined;
    const perGas = fees.maxFeePerGas ?? fees.gasPrice;
    if (perGas === undefined) return undefined;
    return gasLimit * perGas;
  }, [gasLimit, fees]);

  // ---- Write: transfer() ----
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

  useEffect(() => {
    if (hash) {
      onRecord({
        hash,
        type: "transfer",
        token: token.symbol,
        amount,
        counterparty: recipient,
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
      refetchBalance();
    } else if (receiptError) {
      onUpdate(hash, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, receiptError, hash]);

  function handleTransfer() {
    if (!recipientValid || parsedAmount === undefined) return;
    writeContract({
      address: token.address,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient as Address, parsedAmount],
      chainId: SEPOLIA_CHAIN_ID,
    });
  }

  const canSubmit = txReady && status !== "pending" && status !== "confirming";

  const formattedBalance =
    tokenBalance !== undefined
      ? Number(formatUnits(tokenBalance, token.decimals)).toLocaleString("en-US", {
          maximumFractionDigits: 6,
        })
      : null;

  return (
    <div className="space-y-4">
      {/* Balance readout */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-2.5">
        <span className="text-xs text-white/50">Your balance</span>
        <span className="font-mono text-xs text-white/80">
          {formattedBalance !== null ? `${formattedBalance} ${token.symbol}` : "…"}
        </span>
      </div>

      {/* Recipient input */}
      <div className="space-y-1.5">
        <label htmlFor="recipient" className="text-xs font-medium text-white/50">
          Recipient address
        </label>
        <input
          id="recipient"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="0x…"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
          disabled={status === "pending" || status === "confirming"}
          className={[
            "w-full rounded-xl border bg-background/40 px-4 py-3 font-mono text-sm text-white placeholder:text-white/25 outline-none transition-colors disabled:opacity-60",
            showRecipientError ? "border-red-500/50 focus:border-red-500" : "border-border focus:border-accent",
          ].join(" ")}
        />
        {showRecipientError && (
          <p className="text-xs text-red-400">Invalid address.</p>
        )}
      </div>

      {/* Amount input */}
      <div className="space-y-1.5">
        <label htmlFor="transfer-amount" className="text-xs font-medium text-white/50">
          Amount to transfer
        </label>
        <div className="relative">
          <input
            id="transfer-amount"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={status === "pending" || status === "confirming"}
            className={[
              "w-full rounded-xl border bg-background/40 px-4 py-3 pr-20 font-mono text-sm text-white placeholder:text-white/25 outline-none transition-colors disabled:opacity-60",
              insufficientBalance ? "border-red-500/50 focus:border-red-500" : "border-border focus:border-accent",
            ].join(" ")}
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-2">
            <button
              type="button"
              disabled={tokenBalance === undefined || status === "pending" || status === "confirming"}
              onClick={() => {
                if (tokenBalance !== undefined) {
                  setAmount(formatUnits(tokenBalance, token.decimals));
                }
              }}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
            >
              MAX
            </button>
            <span className="text-xs font-medium text-white/40">{token.symbol}</span>
          </div>
        </div>
        {insufficientBalance && (
          <p className="text-xs text-red-400">Insufficient {token.symbol} balance.</p>
        )}
      </div>

      {/* Estimated gas fee */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-2.5">
        <span className="text-xs text-white/50">Estimated gas fee</span>
        <span className="font-mono text-xs text-white/80">
          {txReady && estimatedFeeWei !== undefined
            ? `≈ ${Number(formatEther(estimatedFeeWei)).toFixed(6)} ETH`
            : txReady
              ? "estimating…"
              : "—"}
        </span>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleTransfer}
        disabled={!canSubmit}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
      >
        Transfer {token.symbol}
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
