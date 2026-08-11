"use client";

/**
 * Sidebar — admin-style navigation for the dashboard sections.
 *
 * Purely presentational: the parent owns the active-section state and passes it
 * down with a setter. On mobile it collapses into a horizontal scrollable bar;
 * on desktop it's a fixed vertical rail.
 */

import type { ReactNode } from "react";
import Link from "next/link";

export type SectionId =
  | "overview"
  | "send"
  | "receive"
  | "networks"
  | "tokens";

export interface NavItem {
  id: SectionId;
  label: string;
  description: string;
  Icon: (props: { className?: string }) => ReactNode;
  /** If true, this section needs a connected wallet. */
  requiresWallet: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Portfolio",
    description: "All your tokens",
    requiresWallet: true,
    Icon: ({ className = "" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "send",
    label: "Send",
    description: "Any token",
    requiresWallet: true,
    Icon: ({ className = "" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    ),
  },
  {
    id: "receive",
    label: "Receive",
    description: "Show address & QR",
    requiresWallet: true,
    Icon: ({ className = "" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 17V3" />
        <path d="m6 11 6 6 6-6" />
        <path d="M19 21H5" />
      </svg>
    ),
  },
  {
    id: "networks",
    label: "Networks",
    description: "Switch chains",
    requiresWallet: true,
    Icon: ({ className = "" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path d="M12 7v4m0 0-5 6m5-6 5 6" />
      </svg>
    ),
  },
  {
    id: "tokens",
    label: "Tokens",
    description: "ERC-20 / BEP-20",
    requiresWallet: false,
    Icon: ({ className = "" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="8" cy="8" r="5" />
        <path d="M14.5 5.2a5 5 0 0 1 0 13.6M11 16.9A5 5 0 0 0 16 20" />
      </svg>
    ),
  },
];

interface SidebarProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <nav className="flex gap-2 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={[
              "group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors md:w-full",
              isActive
                ? "bg-accent/15 text-white ring-1 ring-accent/40"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-accent/20 text-accent"
                  : "bg-white/[0.04] text-white/50 group-hover:text-white",
              ].join(" ")}
            >
              <item.Icon className="h-4 w-4" />
            </span>
            <span className="hidden md:block">
              <span className="block text-sm font-semibold leading-tight">
                {item.label}
              </span>
              <span className="block text-[11px] text-white/30">
                {item.description}
              </span>
            </span>
            {/* Mobile: label only, no description. */}
            <span className="text-sm font-semibold md:hidden">
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Route link to the standalone "Write to Smart Contract" page. */}
      <Link
        href="/write"
        className="group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white md:w-full"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/50 transition-colors group-hover:text-white">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </span>
        <span className="hidden md:block">
          <span className="block text-sm font-semibold leading-tight">Write</span>
          <span className="block text-[11px] text-white/30">Approve / transfer</span>
        </span>
        <span className="text-sm font-semibold md:hidden">Write</span>
      </Link>

      {/* Route link to the educational "Learn" page. */}
      <Link
        href="/learn"
        className="group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white md:w-full"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/50 transition-colors group-hover:text-white">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          </svg>
        </span>
        <span className="hidden md:block">
          <span className="block text-sm font-semibold leading-tight">Learn</span>
          <span className="block text-[11px] text-white/30">Core concepts</span>
        </span>
        <span className="text-sm font-semibold md:hidden">Learn</span>
      </Link>
    </nav>
  );
}
