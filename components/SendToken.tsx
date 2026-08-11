"use client";

/**
 * SendToken — send ANY asset (native coin or any ERC-20) on the active network.
 *
 * It uses the portfolio to populate a token picker, then routes to the correct
 * transaction:
 *   - Native coin → useSendTransaction({ to, value })
 *   - ERC-20      → useWriteContract(transfer(to, amount))
 *
 * Shares the same validation (isAddress, sufficient balance) and lifecycle
 * (idle→pending→confirming→confirmed→error) regardless of asset type.
 */

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useSendTransaction,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { isAddress, parseUnits, type Address } from "viem";
import { usePortfolio, type PortfolioToken } from "@/lib/usePortfolio";
import { getChainMeta } from "@/lib/chainMeta";
import { ERC20_ABI } from "@/lib/tokens.config";
import { parseTxError } from "@/lib/txError";
import { TokenLogo } from "./TokenLogo";
import { TxStatus, type TxLifecycle } from "./TxStatus";

export function SendToken() {
  const { address, chain, isConnected } = useAccount();
  const meta = getChainMeta(chain?.id);
  const { data: tokens } = usePortfolio(address, chain?.id);

  const [selectedKey, setSelectedKey] = useState<string>("native");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  // Resolve the selected token (default to native coin).
  const selected: PortfolioToken | undefined = useMemo(() => {
    if (!tokens || tokens.length === 0) return undefined;
    return tokens.find((t) => t.address === selectedKey) ?? tokens[0];
  }, [tokens, selectedKey]);

  const recipientValid = isAddress(recipient);
  const showRecipientError = recipient.length > 0 && !recipientValid;

  const parsedAmount = useMemo<bigint | undefined>(() => {
    if (!selected || !amount || Number.isNaN(Number(amount)) || Number(amount) <= 0)
      return undefined;
    try {
      return parseUnits(amount, selected.decimals);
    } catch {
      return undefined;
    }
  }, [amount, selected]);

  const insufficient =
    selected && parsedAmount !== undefined && parsedAmount > selected.raw;

  const txReady =
    Boolean(selected) && recipientValid && parsedAmount !== undefined && !insufficient;

  // ---- Two transaction paths ----
  const native = useSendTransaction();
  const erc20 = useWriteContract();

  // Whichever path is active provides the hash.
  const hash = selected?.isNative ? native.data : erc20.data;
  const isSigning = selected?.isNative ? native.isPending : erc20.isPending;
  const writeError = selected?.isNative ? native.error : erc20.error;

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } =
    useWaitForTransactionReceipt({ hash, query: { enabled: Boolean(hash) } });

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

  // Reset the amount once a send confirms.
  useEffect(() => {
    if (isConfirmed) setAmount("");
  }, [isConfirmed]);

  function handleSend() {
    if (!selected || !recipientValid || parsedAmount === undefined) return;
    if (selected.isNative) {
      native.sendTransaction({ to: recipient as Address, value: parsedAmount });
    } else {
      erc20.writeContract({
        address: selected.address as Address,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipient as Address, parsedAmount],
      });
    }
  }

  function reset() {
    native.reset();
    erc20.reset();
    setAmount("");
    setRecipient("");
  }

  const busy = status === "pending" || status === "confirming";
  const canSend = txReady && !busy;
  const explorerUrl = chain?.blockExplorers?.default?.url;

  if (!isConnected) return null;

  return (
    <div className="space-y-4">
      {/* Token picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/50">Asset</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            disabled={busy}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 transition-colors hover:border-accent/60 disabled:opacity-60"
          >
            {selected ? (
              <span className="flex items-center gap-2.5">
                <TokenLogo
                  logo={selected.logo}
                  symbol={selected.symbol}
                  color={selected.isNative ? meta.color : "#7c5cff"}
                  size={28}
                />
                <span className="text-left">
                  <span className="block text-sm font-semibold text-white">
                    {selected.symbol}
                  </span>
                  <span className="block text-[11px] text-white/40">
                    Balance: {selected.formatted}
                  </span>
                </span>
              </span>
            ) : (
              <span className="text-sm text-white/40">Loading assets…</span>
            )}
            <svg className="h-4 w-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Dropdown list */}
          {pickerOpen && tokens && tokens.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card p-1 shadow-2xl shadow-black/50">
              {tokens.map((t) => (
                <button
                  key={t.address}
                  type="button"
                  onClick={() => {
                    setSelectedKey(t.address);
                    setPickerOpen(false);
                    setAmount("");
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <span className="flex items-center gap-2.5">
                    <TokenLogo
                      logo={t.logo}
                      symbol={t.symbol}
                      color={t.isNative ? meta.color : "#7c5cff"}
                      size={26}
                    />
                    <span>
                      <span className="block text-sm font-medium text-white">
                        {t.symbol}
                      </span>
                      <span className="block text-[11px] text-white/40">{t.name}</span>
                    </span>
                  </span>
                  <span className="font-mono text-xs text-white/60">{t.formatted}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recipient */}
      <div className="space-y-1.5">
        <label htmlFor="send-to" className="text-xs font-medium text-white/50">
          Recipient address
        </label>
        <input
          id="send-to"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="0x…"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
          disabled={busy}
          className={[
            "w-full rounded-xl border bg-background/40 px-4 py-3 font-mono text-sm text-white placeholder:text-white/25 outline-none transition-colors disabled:opacity-60",
            showRecipientError ? "border-red-500/50 focus:border-red-500" : "border-border focus:border-accent",
          ].join(" ")}
        />
        {showRecipientError && <p className="text-xs text-red-400">Invalid address.</p>}
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label htmlFor="send-amount" className="text-xs font-medium text-white/50">
          Amount
        </label>
        <div className="relative">
          <input
            id="send-amount"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy || !selected}
            className={[
              "w-full rounded-xl border bg-background/40 px-4 py-3 pr-24 font-mono text-sm text-white placeholder:text-white/25 outline-none transition-colors disabled:opacity-60",
              insufficient ? "border-red-500/50 focus:border-red-500" : "border-border focus:border-accent",
            ].join(" ")}
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-2">
            <button
              type="button"
              disabled={!selected || busy}
              onClick={() => {
                if (!selected) return;
                // For native, leave a little for gas; for ERC-20, full balance.
                if (selected.isNative) {
                  const buffer = parseUnits("0.0005", selected.decimals);
                  const max = selected.raw > buffer ? selected.raw - buffer : 0n;
                  setAmount((Number(max) / 10 ** selected.decimals).toString());
                } else {
                  setAmount(selected.formatted.replace(/,/g, ""));
                }
              }}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-accent hover:bg-accent/10 disabled:opacity-40"
            >
              MAX
            </button>
            <span className="text-xs font-medium text-white/40">
              {selected?.symbol ?? ""}
            </span>
          </div>
        </div>
        {insufficient && (
          <p className="text-xs text-red-400">
            Insufficient {selected?.symbol} balance.
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
      >
        Send {selected?.symbol ?? ""}
      </button>

      <TxStatus status={status} hash={hash} errorMessage={errorMessage} explorerUrl={explorerUrl} />

      {(status === "confirmed" || status === "error") && (
        <button
          type="button"
          onClick={reset}
          className="w-full text-center text-xs font-medium text-white/40 hover:text-white"
        >
          Reset
        </button>
      )}
    </div>
  );
}
