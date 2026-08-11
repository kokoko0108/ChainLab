"use client";

/**
 * TokenLogo — renders a token's logo image with a graceful lettered fallback
 * when the image is missing or fails to load. Used across the portfolio, send,
 * and picker UIs for visual consistency.
 */

import { useState } from "react";

interface TokenLogoProps {
  logo?: string | null;
  symbol: string;
  /** Brand color for the fallback avatar (native coins). */
  color?: string;
  size?: number;
  className?: string;
}

export function TokenLogo({
  logo,
  symbol,
  color = "#7c5cff",
  size = 36,
  className = "",
}: TokenLogoProps) {
  const [failed, setFailed] = useState(false);
  const dim = { width: size, height: size };

  if (!logo || failed) {
    return (
      <div
        style={{ ...dim, backgroundColor: `${color}26`, color }}
        className={`flex shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${className}`}
      >
        {symbol.slice(0, 3).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={`${symbol} logo`}
      style={dim}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full bg-white/5 object-contain ${className}`}
    />
  );
}
