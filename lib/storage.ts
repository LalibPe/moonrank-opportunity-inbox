import { useMemo, useState, useSyncExternalStore } from "react";
import { STATUSES, type Override, type Overrides } from "./review";

const KEY = "moonrank.review.v1";
const CHANGED = "moonrank-review-changed";
function subscribe(update: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) update();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGED, update);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGED, update);
  };
}
const unavailable = Symbol("Storage unavailable");
function snapshot() {
  try {
    return window.localStorage.getItem(KEY) ?? "{}";
  } catch {
    return unavailable;
  }
}
function parse(raw: string): Overrides {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid overrides");
  const map: Overrides = Object.create(null);
  for (const [id, entry] of Object.entries(value)) {
    if (!entry || typeof entry !== "object") continue;
    map[id] = {};
    if (typeof entry.draft === "string") map[id].draft = entry.draft;
    if (STATUSES.includes(entry.status)) map[id].status = entry.status;
  }
  return map;
}
const serverSnapshot = () => null;
export function useReviewStorage() {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [writeError, setError] = useState("");
  const state = useMemo(() => {
    if (raw === null) return { ready: false, overrides: {}, error: "" };
    try {
      if (typeof raw !== "string") throw new Error();
      return { ready: true, overrides: parse(raw), error: "" };
    } catch {
      return {
        ready: false,
        overrides: {},
        error:
          "Local review data could not be loaded. Check browser storage before editing.",
      };
    }
  }, [raw]);
  function save(id: string, change: Override) {
    if (!state.ready) return;
    try {
      const latest = parse(window.localStorage.getItem(KEY) ?? "{}");
      latest[id] = { ...latest[id], ...change };
      window.localStorage.setItem(KEY, JSON.stringify(latest));
      setError("");
      window.dispatchEvent(new Event(CHANGED));
    } catch {
      setError(
        "This change could not be saved. Check browser storage and try again.",
      );
    }
  }
  return { ...state, error: state.error || writeError, save };
}
