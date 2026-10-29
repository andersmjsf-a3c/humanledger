"use client";
import { useEffect, useState } from "react";
import { getStore } from "@/vault/ui/useVault";
import { SHARED_ID } from "@/vault/storage";
import type { VaultFile } from "./model";

export interface VaultSummary {
  files: VaultFile[];
  tried: Record<string, string>;
  memoryConfirmed?: string;
  runs: { at: string; flags: number }[];
}

const sum = (o: Record<string, number>) => Object.values(o ?? {}).reduce((n, x) => n + x, 0);

// Reads the person's own vault in this browser and keeps only what the dashboard shows:
// which files exist, when they changed, their version. Never the answers themselves.
export function useVaultSummary(): { summary: VaultSummary | null; reload: () => void } {
  const [summary, setSummary] = useState<VaultSummary | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const s = getStore();
    Promise.all([s.all(), s.getMeta<Record<string, string>>("tried"), s.getMeta<string>("memoryConfirmed"), s.runs()])
      .then(([records, tried, memoryConfirmed, runs]) =>
        setSummary({
          files: records
            .filter((r) => r.id !== SHARED_ID)
            .map((r) => ({
              id: r.id,
              filled: Object.values(r.answers ?? {}).some((v) => String(v).trim() !== ""),
              updatedAt: r.updatedAt,
              version: r.version,
              exported: !!r.exportedHash,
            })),
          tried: tried ?? {},
          memoryConfirmed,
          runs: runs.map((r) => ({ at: r.at, flags: sum(r.aiTellFlags) + sum(r.voiceFlags) })),
        }),
      )
      .catch(() => setSummary({ files: [], tried: {}, runs: [] }));
  }, [n]);
  return { summary, reload: () => setN((x) => x + 1) };
}

export async function confirmMemory(on: boolean) {
  await getStore().setMeta("memoryConfirmed", on ? new Date().toISOString() : undefined);
}

export async function markTried(slug: string) {
  const s = getStore();
  const tried = (await s.getMeta<Record<string, string>>("tried")) ?? {};
  if (!tried[slug]) await s.setMeta("tried", { ...tried, [slug]: new Date().toISOString() });
}
