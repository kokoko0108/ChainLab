"use client";

/**
 * Panel — a titled content card used for each dashboard section, keeping the
 * admin layout visually consistent (title + optional subtitle + body).
 */

import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function Panel({ title, subtitle, children }: PanelProps) {
  return (
    <section className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="mb-5">
        <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-white/40">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
