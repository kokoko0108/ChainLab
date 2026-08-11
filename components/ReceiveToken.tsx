"use client";

/**
 * ReceiveToken — to receive ANY token on EVM you simply share your address;
 * the same address receives the native coin and every ERC-20 on that chain.
 *
 * We render a QR code of the address (easy mobile-wallet scanning) plus a
 * copyable address and an explorer link. There is no transaction to make —
 * "receive" is purely sharing your address.
 */

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import QRCode from "qrcode";
import { getChainMeta } from "@/lib/chainMeta";
import { TokenLogo } from "./TokenLogo";
import { Toast } from "./Toast";

export function ReceiveToken() {
  const { address, chain, isConnected } = useAccount();
  const meta = getChainMeta(chain?.id);

  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate the QR data URL whenever the address changes.
  useEffect(() => {
    if (!address) {
      setQr(null);
      return;
    }
    QRCode.toDataURL(address, {
      margin: 1,
      width: 220,
      color: { dark: "#e8e8f0", light: "#16162a" },
      errorCorrectionLevel: "M",
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [address]);

  if (!isConnected || !address) return null;

  const explorerUrl = chain?.blockExplorers?.default?.url
    ? `${chain.blockExplorers.default.url}/address/${address}`
    : undefined;

  async function copy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-col items-center space-y-5">
      {/* Network context */}
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
        style={{ color: meta.color, backgroundColor: `${meta.color}1f` }}
      >
        <meta.Icon className="h-3.5 w-3.5" />
        Receive on {meta.label}
      </span>

      {/* QR code */}
      <div className="relative rounded-2xl border border-border bg-card p-3 shadow-lg">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="Wallet address QR code" width={220} height={220} />
        ) : (
          <div className="h-[220px] w-[220px] animate-pulse rounded-lg bg-white/5" />
        )}
        {/* Network glyph badge centered on the QR. */}
        <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-4 border-card bg-card">
          <TokenLogo logo={null} symbol={meta.symbol} color={meta.color} size={32} />
        </div>
      </div>

      {/* Address + copy */}
      <button
        type="button"
        onClick={copy}
        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 transition-colors hover:border-accent/60"
      >
        <span className="truncate font-mono text-sm text-white">{address}</span>
        <span className="shrink-0 text-white/40 transition-colors group-hover:text-accent">
          {copied ? (
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </span>
      </button>

      {/* Safety note + explorer */}
      <div className="w-full space-y-2 text-center">
        <p className="text-xs text-white/40">
          Send only <span className="text-white/70">{meta.label}</span> assets to
          this address. Tokens from other networks may be lost.
        </p>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            View on explorer
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7M7 7h10v10" />
            </svg>
          </a>
        )}
      </div>

      <Toast show={copied} message="Address copied!" onHide={() => setCopied(false)} />
    </div>
  );
}
