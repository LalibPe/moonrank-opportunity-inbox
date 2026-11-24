import type data from "../opportunities.json";

export type Opportunity = Readonly<(typeof data)[number]>;
export const MIN_DOMAIN_RATING = 30;
export const TOPICS = [
  "AI search",
  "GEO",
  "SEO",
  "E-commerce SEO",
  "Agencies",
  "B2B marketing",
] as const;
export type Filters = Readonly<{
  rating: boolean;
  contact: boolean;
  topic: boolean;
}>;
export const CLEAR: Filters = { rating: false, contact: false, topic: false };

export function rank<T extends Opportunity>(rows: readonly T[]) {
  return [...rows].sort(
    (a, b) => b.relevanceScore - a.relevanceScore || a.id.localeCompare(b.id),
  );
}
export function filterRows<T extends Opportunity>(
  rows: readonly T[],
  filters: Filters,
) {
  return rows.filter(
    (row) =>
      (!filters.rating || row.domainRating >= MIN_DOMAIN_RATING) &&
      (!filters.contact || Boolean(row.contactName?.trim())) &&
      (!filters.topic || TOPICS.some((topic) => topic === row.topic)),
  );
}
export function count(rows: readonly unknown[]) {
  return rows.length;
}
