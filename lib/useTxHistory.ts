"use client";

/**
 * useTxHistory — persists the last few write transactions in localStorage so
 * the user can see their recent approve/transfer activity across reloads.
 *
 * Stored client-side only (no backend). We cap the list and expose helpers to
 * add a new entry and update its status as the tx confirms / fails.
 */

import { useCallback, useEffect, useState } from "react";

export type TxType = "approve" | "transfer";
export type TxRecordStatus = "pending" | "confirmed" | "error";

export interface TxRecord {
  hash: `0x${string}`;
  type: TxType;
  token: string;
  amount: string;
  /** Recipient (transfer) or spender (approve). */
  counterparty: string;
  status: TxRecordStatus;
  chainId: number;
  timestamp: number;
}

const STORAGE_KEY = "chainlab.txHistory";
const MAX_RECORDS = 5;

function read(): TxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TxRecord[]) : [];
  } catch {
    return [];
  }
}

function write(records: TxRecord[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function useTxHistory() {
  const [records, setRecords] = useState<TxRecord[]>([]);

  // Hydrate from localStorage on mount (client only).
  useEffect(() => {
    setRecords(read());
  }, []);

  /** Add a new pending record, keeping only the most recent MAX_RECORDS. */
  const addRecord = useCallback((record: TxRecord) => {
    setRecords((prev) => {
      const next = [record, ...prev.filter((r) => r.hash !== record.hash)].slice(
        0,
        MAX_RECORDS,
      );
      write(next);
      return next;
    });
  }, []);

  /** Update an existing record's status by hash (e.g. pending → confirmed). */
  const updateStatus = useCallback(
    (hash: `0x${string}`, status: TxRecordStatus) => {
      setRecords((prev) => {
        const next = prev.map((r) => (r.hash === hash ? { ...r, status } : r));
        write(next);
        return next;
      });
    },
    [],
  );

  return { records, addRecord, updateStatus };
}
