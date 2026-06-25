"use client";

/**
 * Toast — a small, self-dismissing notification shown bottom-center.
 * Used for the "Address copied to clipboard!" confirmation.
 *
 * It's controlled by the parent via the `show` prop; when shown, it starts a
 * timer and calls `onHide` after `duration` ms so the parent can reset state.
 */

import { useEffect } from "react";

interface ToastProps {
  show: boolean;
  message: string;
  onHide: () => void;
  duration?: number;
}

export function Toast({ show, message, onHide, duration = 2000 }: ToastProps) {
  useEffect(() => {
    if (!show) return;
    // Auto-dismiss after `duration`. Clear the timer if the component
    // unmounts or `show` flips, to avoid calling onHide on a stale render.
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [show, duration, onHide]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="animate-toast-in flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-xl shadow-black/40">
        {/* Green check icon */}
        <svg
          className="h-5 w-5 text-green-400"
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
        <span className="text-sm font-medium text-white">{message}</span>
      </div>
    </div>
  );
}
