/**
 * Per-chain visual metadata: brand color + a compact logo glyph.
 *
 * Real blockchain apps brand each network with its own color and mark so users
 * can recognize the active chain at a glance. We key everything off the numeric
 * chainId so it stays in sync with wagmi's active chain.
 *
 * Each `Icon` is a self-contained inline SVG (no external assets) sized to fit
 * inside a small rounded badge. `color` is the network's primary brand color and
 * is reused for accents (active state, glows, the balance coin label).
 */

import type { ReactNode } from "react";
import {
  mainnet,
  base,
  polygon,
  arbitrum,
  optimism,
  bsc,
  sepolia,
} from "wagmi/chains";

export interface ChainMeta {
  /** Short display label (often shorter than chain.name). */
  label: string;
  /** Native coin ticker shown next to balances. */
  symbol: string;
  /** Primary brand color (hex). */
  color: string;
  /** Inline SVG mark, inherits `color` via currentColor where possible. */
  Icon: (props: { className?: string }) => ReactNode;
  /** True for test networks (e.g. Sepolia) so the UI can badge them. */
  testnet?: boolean;
}

const EthGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="currentColor" d="M12 2 5.5 12.3 12 16l6.5-3.7L12 2Z" opacity="0.9" />
    <path fill="currentColor" d="M12 17.2 5.5 13.5 12 22l6.5-8.5L12 17.2Z" opacity="0.55" />
  </svg>
);

const BaseGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
    <path
      fill="currentColor"
      d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 8.84-7.3H8.6v-3.4h12.24A9 9 0 0 0 12 3Z"
    />
  </svg>
);

const PolygonGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="m16.2 8.6-3-1.7a.9.9 0 0 0-.9 0l-3 1.7a.9.9 0 0 0-.45.78V12l-1.95 1.1V9.5a.9.9 0 0 1 .45-.78l4.95-2.85a.9.9 0 0 1 .9 0l4.95 2.85a.9.9 0 0 1 .45.78v5.7a.9.9 0 0 1-.45.78l-4.95 2.85a.9.9 0 0 1-.9 0l-3-1.72v-2.26l3 1.74 1.95-1.12v-2.24l-1.95-1.12Z"
    />
  </svg>
);

const ArbitrumGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
    <path
      fill="currentColor"
      d="m10.4 7.2 1.6 2.7-3.6 6.2H6.2l4.2-8.9Zm3.2 0 4.2 8.9h-2.2l-.8-1.7-2.1-3.6 1-1.7Zm-1.6 4.6 1.6 2.8h-3.2l1.6-2.8Z"
    />
  </svg>
);

const OptimismGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
    <path
      fill="currentColor"
      d="M9 9.3c-1.8 0-3 1.2-3.3 2.9C5.4 14 6.3 15 8 15s3-.9 3.3-2.8C11.6 10.4 10.7 9.3 9 9.3Zm-.2 4.1c-.6 0-.9-.4-.8-1 .1-.8.5-1.3 1.2-1.3.6 0 .9.4.8 1-.1.8-.5 1.3-1.2 1.3Zm6-4.1h-2.5L11.5 15h1.4l.3-1.5h1.2c1.4 0 2.4-.7 2.6-2 .2-1.4-.6-2.2-2.2-2.2Zm.3 2.1c-.1.5-.4.7-1 .7h-.8l.3-1.4h.8c.5 0 .8.2.7.7Z"
    />
  </svg>
);

const TestnetGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M9 3h6v2h-1v4.2l3.6 6.3A2 2 0 0 1 15.86 19H8.14a2 2 0 0 1-1.74-3.5L10 9.2V5H9V3Zm3 9.5-2.2 3.9h4.4L12 12.5Z"
    />
  </svg>
);

const BnbGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="m12 4 2.2 2.2L9.6 10.8 7.4 8.6 12 4Zm4.6 4.6L18.8 10.8l-2.2 2.2-2.2-2.2 2.2-2.2ZM12 9.2l2.2 2.2L12 13.6l-2.2-2.2L12 9.2Zm-4.6-.6 2.2 2.2-2.2 2.2L5.2 10.8l2.2-2.2ZM12 12.4l2.2 2.2L12 16.8l-2.2-2.2L12 12.4Z"
    />
  </svg>
);

export const CHAIN_META: Record<number, ChainMeta> = {
  [mainnet.id]: { label: "Ethereum", symbol: "ETH", color: "#627eea", Icon: EthGlyph },
  [base.id]: { label: "Base", symbol: "ETH", color: "#0052ff", Icon: BaseGlyph },
  [polygon.id]: { label: "Polygon", symbol: "POL", color: "#8247e5", Icon: PolygonGlyph },
  [arbitrum.id]: { label: "Arbitrum", symbol: "ETH", color: "#28a0f0", Icon: ArbitrumGlyph },
  [optimism.id]: { label: "Optimism", symbol: "ETH", color: "#ff0420", Icon: OptimismGlyph },
  [bsc.id]: { label: "BNB Chain", symbol: "BNB", color: "#f0b90b", Icon: BnbGlyph },
  [sepolia.id]: {
    label: "Sepolia",
    symbol: "ETH",
    color: "#2dd4bf",
    Icon: TestnetGlyph,
    testnet: true,
  },
};

/** Safe lookup with a neutral fallback for unknown/unsupported chains. */
export function getChainMeta(chainId: number | undefined): ChainMeta {
  if (chainId && CHAIN_META[chainId]) return CHAIN_META[chainId];
  return { label: "Unknown", symbol: "ETH", color: "#7c5cff", Icon: EthGlyph };
}
