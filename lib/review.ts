import type { Opportunity } from "./rules";
export const STATUSES = ["To review", "Approved", "Skipped", "Done"] as const;
export type Status = (typeof STATUSES)[number];
export type Override = { draft?: string; status?: Status };
export type Overrides = Record<string, Override>;

export function mergeRows(rows: readonly Opportunity[], overrides: Overrides) {
  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    draft: overrides[row.id]?.draft ?? row.draft,
    status: overrides[row.id]?.status ?? "To review",
  }));
}
