"use client";

/**
 * TxStatus — visualizes the lifecycle of a single write transaction.
 *
 * States (driven by the parent from wagmi hook state):
 *   idle       → "Ready"
 *   pending    → "Waiting for signature…" (the wallet popup is open)
 *   confirming → "Confirming on blockchain…" (signed; waiting to be mined)
 *   confirmed  → "✅ Success!" + tx hash + explorer link
 *   error      → "❌ Failed: <message>"
 */

import { Spinner } from "./Spinner";

export type TxLifecycle =
  | "idle"
  | "pending"
  | "confirming"
  | "confirmed"
  | "error";

interface TxStatusProps {
  status: TxLifecycle;
  /** Submitted tx hash, once available. */
  hash?: `0x${string}`;
  /** Friendly error message when status === "error". */
  errorMessage?: string | null;
  /** Block explorer base URL for the active chain (e.g. sepolia.etherscan.io). */
  explorerUrl?: string;
  /** Confirmations observed so far (shown during confirming). */
  confirmations?: number;
}

export function TxStatus({
  status,
  hash,
  errorMessage,
  explorerUrl,
  confirmations,
}: TxStatusProps) {
  if (status === "idle") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-white/30" />
        <span className="text-sm text-white/50">Ready</span>
      </div>
    );
  }

  const txLink =
    hash && explorerUrl ? `${explorerUrl}/tx/${hash}` : undefined;

  return (
    <div
      className={[
        "rounded-xl border px-4 py-3",
        status === "confirmed"
          ? "border-green-500/30 bg-green-500/10"
          : status === "error"
            ? "border-red-500/30 bg-red-500/10"
            : "border-accent/30 bg-accent/10",
      ].join(" ")}
    >
      <div className="flex items-center gap-2.5">
        {(status === "pending" || status === "confirming") && (
          <Spinner className="h-4 w-4 text-accent" />
        )}
        <span
          className={[
            "text-sm font-medium",
            status === "confirmed"
              ? "text-green-300"
              : status === "error"
                ? "text-red-300"
                : "text-accent",
          ].join(" ")}
        >
          {status === "pending" && "Waiting for signature…"}
          {status === "confirming" && (
            <>
              Confirming on blockchain…
              {typeof confirmations === "number" && confirmations > 0 && (
                <span className="ml-1 text-white/50">
                  ({confirmations} block{confirmations === 1 ? "" : "s"})
                </span>
              )}
            </>
          )}
          {status === "confirmed" && "✅ Success!"}
          {status === "error" && `❌ Failed: ${errorMessage ?? "Unknown error"}`}
        </span>
      </div>

      {/* TX hash + explorer link, shown once we have a hash and no error. */}
      {hash && status !== "error" && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="truncate font-mono text-[11px] text-white/40">
            {hash}
          </span>
          {txLink && (
            <a
              href={txLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-accent hover:underline"
            >
              Etherscan
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
