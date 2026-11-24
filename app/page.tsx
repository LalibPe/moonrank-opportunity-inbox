"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Inbox,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  PanelRight,
  Globe2,
  PencilLine,
  UserRound,
  Monitor,
  Check,
} from "lucide-react";
import fixture from "../opportunities.json";
import { mergeRows, STATUSES, type Status } from "../lib/review";
import { useReviewStorage } from "../lib/storage";
import {
  CLEAR,
  count,
  filterRows,
  MIN_DOMAIN_RATING,
  rank,
  TOPICS,
  type Filters,
} from "../lib/rules";

const ranked = rank(fixture);
const controls = [
  { key: "rating", label: `DR ≥ ${MIN_DOMAIN_RATING}` },
  { key: "contact", label: "Has contact" },
  { key: "topic", label: "Target topics" },
] as const;

export default function InboxPage() {
  const [filters, setFilters] = useState<Filters>(CLEAR);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selection, select] = useState<string | null>(ranked[0]?.id ?? null);
  const storage = useReviewStorage();
  const merged = mergeRows(ranked, storage.overrides);
  const visible = filterRows(merged, filters);
  const row = visible.find((item) => item.id === selection);
  const list = useRef<HTMLDivElement>(null);
  const previousTops = useRef<Map<string, number> | null>(null);

  useLayoutEffect(() => {
    const before = previousTops.current;
    previousTops.current = null;
    if (!before || !list.current) return;

    const buttons = list.current.querySelectorAll<HTMLButtonElement>("[data-row]");
    // Read every destination before starting any transforms.
    const moves = Array.from(buttons, button => {
      button.getAnimations().forEach(animation => animation.cancel());
      const oldTop = before.get(button.dataset.row!);
      return { button, shift: oldTop === undefined ? 8 : oldTop - button.getBoundingClientRect().top, entering: oldTop === undefined };
    });
    for (const { button, shift, entering } of moves) {
      button.animate([
        { transform: `translateY(${shift}px)`, opacity: entering ? 0 : 0.84 },
        { transform: "translateY(0)", opacity: 1 },
      ], { duration: 260, easing: "cubic-bezier(.22,.7,.25,1)" });
    }
  }, [filters]);

  function changeFilters(next: Filters) {
    if (list.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      previousTops.current = new Map(Array.from(
        list.current.querySelectorAll<HTMLButtonElement>("[data-row]"),
        button => [button.dataset.row!, button.getBoundingClientRect().top],
      ));
    }
    if (!filterRows(ranked, next).some((item) => item.id === selection))
      select(null);
    setFilters(next);
  }
  return (
    <>
      <header>
        <div className="shell flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/icon.svg" width={34} height={34} alt="" unoptimized />
            <strong className="wordmark">Moonrank</strong>
            <span className="header-divider" />
            <span className="header-label">Workspace</span>
          </div>
          <span className="local">
            <Monitor size={15} /> Local workspace
          </span>
        </div>
      </header>
      <main className="shell">
        <div className="overview">
          <div>
            <div className="eyebrow">
              <span className="accent-line" /> OUTREACH WORKSPACE
            </div>
            <h1>Opportunity inbox</h1>
          </div>
          <div className="review-count">
            <Inbox size={18} />
            <strong>
              {count(merged.filter((item) => item.status === "To review"))}
            </strong>{" "}
            to review
          </div>
        </div>
        <div className="toolbar">
          <button type="button" className="filter-title" aria-expanded={filtersOpen}
            aria-controls="filter-options" onClick={() => setFiltersOpen(open => !open)}>
            <SlidersHorizontal size={17} /> Filters
            {filtersOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          <div id="filter-options" hidden={!filtersOpen}>
          {controls.map(({ key, label }) => (
            <label
              className="filter"
              key={key}
              title={key === "topic" ? TOPICS.join(", ") : undefined}
            >
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={(e) =>
                  changeFilters({ ...filters, [key]: e.target.checked })
                }
              />
              <span className="box">
                <Check size={11} />
              </span>
              {label}
            </label>
          ))}
          {Object.values(filters).some(Boolean) && (
            <button className="clear" onClick={() => changeFilters(CLEAR)}>
              Clear filters
            </button>
          )}
          </div>
        </div>
        <div className="workspace">
          <section className="card">
            <div className="panel-head">
              <h2>
                <ListOrdered size={20} /> Ranked opportunities
              </h2>
              <span className="pill" aria-live="polite">
                {count(visible)} visible
              </span>
            </div>
            <div className="column-labels grid-row">
              <span>RANK</span>
              <span>OPPORTUNITY</span>
              <span>SCORE</span>
            </div>
            <div className="results" ref={list}>
              {visible.map((item) => (
                <button
                  key={item.id}
                  data-row={item.id}
                  aria-pressed={selection === item.id}
                  onClick={() => select(item.id)}
                  className="result grid-row"
                >
                  <span className="rank-num">
                    {String(item.rank).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <strong className="row-title">
                      {item.linkingPageTitle}
                    </strong>
                    <span className="row-meta">
                      {item.domain}
                      <span>·</span> DR {item.domainRating}
                      {item.status !== "To review" && <b>{item.status}</b>}
                    </span>
                  </span>
                  <span className="score">
                    {item.relevanceScore}
                    <i>
                      <b style={{ width: item.relevanceScore + "%" }} />
                    </i>
                  </span>
                </button>
              ))}
              {!visible.length && (
                <div className="empty">
                  No matching opportunities.
                  <button onClick={() => changeFilters(CLEAR)}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </section>
          <section className="card inspector" aria-label="Opportunity details">
            <div className="panel-head">
              <h2>
                <PanelRight size={19} /> Opportunity details
              </h2>
              {row && <code>{row.id}</code>}
            </div>
            {row ? (
              <div className="details" key={row.id}>
                <span className="topic">{row.topic}</span>
                <h3>{row.linkingPageTitle}</h3>
                <div className="metrics">
                  <span>
                    Relevance <b>{row.relevanceScore}</b>
                  </span>
                  <span>
                    Domain rating <b>{row.domainRating}</b>
                  </span>
                </div>
                <dl>
                  <dt>
                    <Globe2 /> Source page
                  </dt>
                  <dd className="url">{row.linkingPageUrl}</dd>
                  <dt>Linked competitor</dt>
                  <dd>{row.competitorLinked}</dd>
                  <dt>
                    <UserRound /> Contact
                  </dt>
                  <dd>
                    {row.contactName?.trim() || "No contact"}
                    {row.contactName?.trim() && row.contactRole && (
                      <span className="role"> · {row.contactRole}</span>
                    )}
                    {row.contactLinkedinUrl && (
                      <div className="url">{row.contactLinkedinUrl}</div>
                    )}
                  </dd>
                </dl>
                <label className="editor-label" htmlFor="draft">
                  <PencilLine size={16} /> Outreach draft
                </label>
                <textarea
                  id="draft"
                  disabled={!storage.ready}
                  value={row.draft}
                  onChange={(e) =>
                    storage.save(row.id, { draft: e.target.value })
                  }
                />
                <div className="status-field">
                  <label htmlFor="status">Review status</label>
                  <select
                    id="status"
                    disabled={!storage.ready}
                    value={row.status}
                    onChange={(e) =>
                      storage.save(row.id, { status: e.target.value as Status })
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
                {storage.error && <p role="alert">{storage.error}</p>}
              </div>
            ) : (
              <div className="empty">
                <PanelRight />
                Select an opportunity to review its details.
                <button onClick={() => changeFilters(CLEAR)}>
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
