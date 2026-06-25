"use client";

/**
 * SendETH — send the native coin (ETH/POL/BNB…) to another address.
 *
 * Web3 concepts for beginners:
 * - A "transaction" is a signed instruction to the blockchain (here: "move N
 *   coins to address X"). It must be signed by your wallet (MetaMask popup).
 * - "Gas" is the fee paid to validators to include your transaction. The fee ≈
 *   gasLimit × gasPrice. We ESTIMATE it before sending so the user knows the
 *   cost. Gas is always paid in the chain's native coin.
 * - A "transaction hash" (0x…) is the unique id of a submitted tx. You can look
 *   it up on a block explorer (Etherscan) to watch it confirm.
 * - "Confirmed" means the tx was included in a block. Until then it's "pending".
 *
 * Hooks used (wagmi v2):
 * - useSendTransaction(): submits the tx and returns its hash. The MetaMask
 *   signing popup is triggered when we call sendTransaction().
 * - useWaitForTransactionReceipt(): polls the chain until the tx is mined,
 *   giving us the idle → pending → confirmed lifecycle.
 * - useEstimateGas() + useEstimateFeesPerGas(): together estimate the fee.
 *
 * viem:
 * - isAddress(): validates the recipient is a well-formed 0x address.
 * - parseEther(): converts a human "0.1" string into wei (bigint) for sending.
 * - formatEther(): converts wei back to a human-readable string for display.
 */

import { useMemo, useState } from "react";
import {
  useAccount,
  useBalance,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useEstimateGas,
  useEstimateFeesPerGas,
} from "wagmi";
import { isAddress, parseEther, formatEther, type Address } from "viem";
import { getChainMeta } from "@/lib/chainMeta";
import { Spinner } from "./Spinner";

/** High-level lifecycle of a send, used to drive the status UI. */
type SendStatus = "idle" | "pending" | "confirmed" | "error";

export function SendETH() {
  const { address, chain, isConnected } = useAccount();
  const meta = getChainMeta(chain?.id);

  // Sender's current native balance — used for the insufficient-balance check.
  const { data: balance } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  });

  // ---- Form state ----
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  // When true, show the review/confirmation panel before triggering the wallet
  // signing popup, so the user can double-check details first.
  const [showConfirm, setShowConfirm] = useState(false);

  // ---- Derived validation ----
  // A well-formed recipient address (viem's isAddress checks the 0x format
  // and length). We narrow to viem's `Address` type for the hooks below.
  const recipientIsValid = isAddress(recipient);
  const recipientAddress = recipientIsValid ? (recipient as Address) : undefined;

  // Parse the amount string into wei (bigint). Guard against empty / invalid
  // numeric input so parseEther never throws.
  const parsedAmount = useMemo<bigint | undefined>(() => {
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return undefined;
    }
    try {
      return parseEther(amount);
    } catch {
      return undefined;
    }
  }, [amount]);

  // The transaction is "shaped" (has a valid to + value) — required before we
  // can estimate gas or send.
  const txReady = Boolean(recipientAddress && parsedAmount !== undefined);

  // ---- Gas estimation ----
  // Estimate the gas units this transfer needs (≈21000 for a plain send, but
  // we ask the node to be safe), and the per-gas fee for the current chain.
  const { data: gasLimit } = useEstimateGas({
    to: recipientAddress,
    value: parsedAmount,
    query: { enabled: txReady },
  });
  const { data: fees } = useEstimateFeesPerGas({
    query: { enabled: txReady },
  });

  // Total estimated fee in wei = gasLimit × maxFeePerGas (EIP-1559). Falls back
  // to gasPrice for non-1559 chains.
  const estimatedFeeWei = useMemo<bigint | undefined>(() => {
    if (gasLimit === undefined || !fees) return undefined;
    const perGas = fees.maxFeePerGas ?? fees.gasPrice;
    if (perGas === undefined) return undefined;
    return gasLimit * perGas;
  }, [gasLimit, fees]);

  // ---- Balance sufficiency ----
  // Must cover amount + estimated fee. If we don't have a fee estimate yet,
  // we conservatively check against the amount alone.
  const totalCost =
    parsedAmount !== undefined
      ? parsedAmount + (estimatedFeeWei ?? 0n)
      : undefined;
  const insufficientBalance =
    balance !== undefined &&
    totalCost !== undefined &&
    totalCost > balance.value;

  // ---- Send transaction ----
  const {
    data: txHash,
    sendTransaction,
    isPending: isSigning, // waiting for the user to sign in MetaMask
    error: sendError,
    reset: resetSend,
  } = useSendTransaction();

  // ---- Wait for confirmation ----
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  });

  // ---- Derive a single status from the hook states ----
  const status: SendStatus = useMemo(() => {
    if (sendError || receiptError) return "error";
    if (isConfirmed) return "confirmed";
    if (isSigning || isConfirming || txHash) return "pending";
    return "idle";
  }, [sendError, receiptError, isConfirmed, isSigning, isConfirming, txHash]);

  // Human-friendly error message for the various failure modes.
  const errorMessage = useMemo<string | null>(() => {
    const err = sendError ?? receiptError;
    if (!err) return null;
    const code = (err as { code?: number }).code;
    if (code === 4001 || /reject|denied/i.test(err.message)) {
      return "You rejected the transaction.";
    }
    const short = (err as { shortMessage?: string }).shortMessage;
    return short ?? "Transaction failed. Please try again.";
  }, [sendError, receiptError]);

  // Whether the form can be submitted.
  const canSend =
    isConnected &&
    txReady &&
    !insufficientBalance &&
    status !== "pending";

  // Build a block-explorer link for the tx hash if the chain exposes one.
  const explorerTxUrl =
    txHash && chain?.blockExplorers?.default?.url
      ? `${chain.blockExplorers.default.url}/tx/${txHash}`
      : undefined;

  /** Confirm the review panel — triggers the actual MetaMask signing popup. */
  function handleConfirmSend() {
    if (!recipientAddress || parsedAmount === undefined) return;
    setShowConfirm(false);
    sendTransaction({ to: recipientAddress, value: parsedAmount });
  }

  /** Reset the form + hook state back to idle for another send. */
  function handleReset() {
    resetSend();
    setRecipient("");
    setAmount("");
    setShowConfirm(false);
  }

  if (!isConnected) return null;

  // Show inline validation hints only once the user has typed something.
  const showAddressError = recipient.length > 0 && !recipientIsValid;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-white/40">
          Send {meta.symbol}
        </p>
        {balance && (
          <p className="text-[11px] text-white/30">
            Balance: {Number(balance.formatted).toFixed(4)} {balance.symbol}
          </p>
        )}
      </div>

      {/* Recipient address input */}
      <div className="space-y-1.5">
        <label
          htmlFor="recipient"
          className="text-xs font-medium text-white/50"
        >
          Recipient address
        </label>
        <input
          id="recipient"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="0x…"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
          disabled={status === "pending"}
          className={[
            "w-full rounded-xl border bg-background/40 px-4 py-3 font-mono text-sm text-white placeholder:text-white/25 outline-none transition-colors disabled:opacity-60",
            showAddressError
              ? "border-red-500/50 focus:border-red-500"
              : "border-border focus:border-accent",
          ].join(" ")}
        />
        {showAddressError && (
          <p className="text-xs text-red-400">Invalid Ethereum address.</p>
        )}
      </div>

      {/* Amount input with a MAX helper */}
      <div className="space-y-1.5">
        <label htmlFor="amount" className="text-xs font-medium text-white/50">
          Amount
        </label>
        <div className="relative">
          <input
            id="amount"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={status === "pending"}
            className={[
              "w-full rounded-xl border bg-background/40 px-4 py-3 pr-28 font-mono text-sm text-white placeholder:text-white/25 outline-none transition-colors disabled:opacity-60",
              insufficientBalance
                ? "border-red-500/50 focus:border-red-500"
                : "border-border focus:border-accent",
            ].join(" ")}
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-2">
            {/* MAX fills the amount with (balance − a fee buffer) so the send
                still leaves room for gas. */}
            <button
              type="button"
              disabled={!balance || status === "pending"}
              onClick={() => {
                if (!balance) return;
                // Leave the estimated fee (or a small buffer) for gas.
                const buffer = estimatedFeeWei ?? parseEther("0.0005");
                const max =
                  balance.value > buffer ? balance.value - buffer : 0n;
                setAmount(formatEther(max));
              }}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
            >
              MAX
            </button>
            <span className="text-xs font-medium text-white/40">
              {meta.symbol}
            </span>
          </div>
        </div>
        {insufficientBalance && (
          <p className="text-xs text-red-400">
            Insufficient balance for amount + gas.
          </p>
        )}
      </div>

      {/* Estimated gas fee */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-2.5">
        <span className="text-xs text-white/50">Estimated gas fee</span>
        <span className="font-mono text-xs text-white/80">
          {txReady && estimatedFeeWei !== undefined ? (
            `≈ ${Number(formatEther(estimatedFeeWei)).toFixed(6)} ${meta.symbol}`
          ) : txReady ? (
            <span className="flex items-center gap-1.5 text-white/40">
              <Spinner className="h-3 w-3" /> estimating…
            </span>
          ) : (
            <span className="text-white/30">—</span>
          )}
        </span>
      </div>

      {/* Send / status button */}
      {status === "confirmed" ? (
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500/15 px-6 py-3 font-semibold text-green-300 ring-1 ring-green-500/40 transition-colors hover:bg-green-500/25"
        >
          <CheckIcon /> Sent! Send another
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={!canSend}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent-hover hover:shadow-accent/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent disabled:active:scale-100"
        >
          {status === "pending" ? (
            <>
              <Spinner className="h-4 w-4" />
              {isSigning ? "Confirm in wallet…" : "Confirming on-chain…"}
            </>
          ) : (
            <>
              <SendIcon /> Send {meta.symbol}
            </>
          )}
        </button>
      )}

      {/* Status / hash / error panel */}
      {status === "error" && errorMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5">
          <p className="text-sm text-red-300">{errorMessage}</p>
          <button
            onClick={resetSend}
            className="text-xs font-medium text-red-300/80 hover:text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Transaction hash + explorer link (shown once we have a hash). */}
      {txHash && status !== "error" && (
        <div className="rounded-xl border border-border bg-background/40 px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-white/50">
              {status === "confirmed" ? "Confirmed" : "Transaction"}
            </span>
            {explorerTxUrl && (
              <a
                href={explorerTxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                View on explorer
                <ExternalIcon />
              </a>
            )}
          </div>
          <p className="mt-1 truncate font-mono text-[11px] text-white/40">
            {txHash}
          </p>
        </div>
      )}

      {/* ---- Confirmation modal ----
          Opened by the Send button. Lets the user review the recipient, amount,
          gas fee and total before the wallet signing popup is triggered. */}
      {showConfirm && recipientAddress && parsedAmount !== undefined && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm transaction"
        >
          {/* Backdrop — click to cancel. */}
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => setShowConfirm(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="animate-toast-in relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-black/50">
            <div className="mb-4 flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
              >
                <SendIcon />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Confirm transaction
                </h3>
                <p className="text-[11px] text-white/40">
                  Review before signing in your wallet
                </p>
              </div>
            </div>

            {/* Amount headline */}
            <div className="mb-4 rounded-xl border border-border bg-background/40 p-4 text-center">
              <p className="text-[11px] uppercase tracking-wider text-white/40">
                You are sending
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-white">
                {amount}{" "}
                <span style={{ color: meta.color }}>{meta.symbol}</span>
              </p>
            </div>

            {/* Detail rows */}
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-white/50">From</dt>
                <dd className="font-mono text-xs text-white/80">
                  {address}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-white/50">To</dt>
                <dd className="break-all text-right font-mono text-xs text-white/80">
                  {recipientAddress}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/50">Network</dt>
                <dd className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                  <meta.Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/50">Est. gas fee</dt>
                <dd className="font-mono text-xs text-white/80">
                  {estimatedFeeWei !== undefined
                    ? `≈ ${Number(formatEther(estimatedFeeWei)).toFixed(6)} ${meta.symbol}`
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5">
                <dt className="font-medium text-white/70">Total (amount + gas)</dt>
                <dd className="font-mono text-xs font-semibold text-white">
                  {totalCost !== undefined
                    ? `${Number(formatEther(totalCost)).toFixed(6)} ${meta.symbol}`
                    : `${amount} ${meta.symbol}`}
                </dd>
              </div>
            </dl>

            {/* Actions */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-xl border border-border bg-background/40 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover active:scale-[0.98]"
              >
                <SendIcon /> Confirm &amp; Sign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Small inline icons (no external deps) ---- */

function SendIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}
