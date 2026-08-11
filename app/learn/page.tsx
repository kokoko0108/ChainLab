"use client";

/**
 * Learn page — explains the core smart-contract concepts behind ChainLab as a
 * grid of cards. Static educational content; no wallet interaction needed.
 */

import Link from "next/link";
import { CONCEPTS } from "@/lib/concepts";

export default function LearnPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(124,92,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(124,92,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(55%_45%_at_50%_-5%,rgba(124,92,255,0.18),transparent_70%)]"
      />

      <div className="relative z-10 w-full max-w-3xl">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to dashboard
        </Link>

        {/* Header */}
        <header className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent shadow-lg shadow-accent/30">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Smart Contract Concepts
            </h1>
            <p className="text-sm text-white/50">
              The building blocks behind ChainLab&apos;s contract features.
            </p>
          </div>
        </header>

        {/* Concept cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CONCEPTS.map((c, i) => {
            const card = (
              <div
                className="group h-full rounded-2xl border border-border bg-card/80 p-5 shadow-xl shadow-black/30 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15"
                style={{
                  backgroundImage: `radial-gradient(120% 100% at 100% 0%, ${c.color}14, transparent 55%)`,
                }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-white/20">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                    style={{ color: c.color, backgroundColor: `${c.color}1a` }}
                  >
                    <c.Icon className="h-5 w-5" />
                  </span>
                  <h2 className="text-base font-bold text-white">{c.title}</h2>
                </div>
                <p className="text-sm font-medium text-white/80">{c.summary}</p>
                <p className="mt-2 text-xs leading-relaxed text-white/45">
                  {c.detail}
                </p>
                {c.href && (
                  <span
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium transition-colors"
                    style={{ color: c.color }}
                  >
                    Learn more
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M7 17 17 7M7 7h10v10" />
                    </svg>
                  </span>
                )}
              </div>
            );

            return c.href ? (
              <a
                key={c.id}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {card}
              </a>
            ) : (
              <div key={c.id}>{card}</div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-white/30">
          See these concepts in action in the{" "}
          <Link href="/write" className="text-accent hover:underline">
            Write to Smart Contract
          </Link>{" "}
          page.
        </p>
      </div>
    </main>
  );
}
