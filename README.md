# Moonrank opportunity inbox

A local review workspace for 50 supplied outreach opportunities. Pick a ranked source page, review the contact and linked competitor, edit the draft, and set a review status. Edits are saved immediately in the current browser at the current origin.

## Run locally

Use Node.js 22.18 or later and npm. The first install needs registry access. Run these commands in PowerShell.

```powershell
git clone https://github.com/LalibPe/moonrank-opportunity-inbox.git
cd moonrank-opportunity-inbox
npm ci
$env:NEXT_TELEMETRY_DISABLED = '1'
npm test
npm run lint
npm run build
npm start -- --hostname 127.0.0.1 --port 3000
```

Open http://127.0.0.1:3000. On Windows systems with PowerShell script execution restricted, use `npm.cmd` in place of `npm`. In a POSIX shell use `export NEXT_TELEMETRY_DISABLED=1`. For development, run `npm run dev` in place of the build and start commands.

## Interview walkthrough

1. Open a fresh browser profile on the local URL. The three filters start off. The inbox opens on `op_35`, ranked first by its supplied score of 94.
2. Open the second row, `op_01` (aioseo.com, DR 14). Turn on the rating filter. The row and its details disappear. Choose **Clear filters** to restore 50 rows. The selection stays cleared until you choose another row.
3. Enable all three filters. The list reads **41 visible** and the global counter reads **50 to review**. Open `op_35`, change the draft and select **Approved**. The global counter becomes **49**.
4. Visit another row, reload, and reopen both rows. Their drafts and statuses stay separate. Return `op_35` to **To review** to restore **50**. Erase the draft and reload. The editor stays empty.

With the production server running and Google Chrome installed, run `npm run test:browser` in a second terminal. This repeats the walkthrough in a disposable browser context and checks for off-origin requests and page errors. For installed Edge, set `BROWSER_CHANNEL=msedge` using your shell's environment-variable syntax. Set `APP_URL` to test another local port.

## Where to change the rating threshold

Edit **`MIN_DOMAIN_RATING` in [lib/rules.ts](lib/rules.ts)**. Both the checkbox label and the comparison use that value. Equality passes. The same file defines the six allowed topics, the score-descending and ID-ascending sort, and the independent filter predicates. The tests pin the assignment's original expected counts.

## Implementation

- Next.js App Router and TypeScript render the inbox. Tailwind utilities and local CSS handle the two-column desktop layout and stacked mobile layout. All icons, fonts and page assets resolve locally.
- The app imports the original [opportunities.json](opportunities.json). Ranking copies the input array. Filters and review merges create derived rows. The app has no fixture-write path.
- [lib/storage.ts](lib/storage.ts) owns the versioned `moonrank.review.v1` localStorage map. Each ID can override only its draft and status. Editing unlocks after browser storage loads. A saved empty string takes precedence over the fixture draft.
- [lib/review.ts](lib/review.ts) defaults every row to **To review**, including both previously contacted rows. The global counter uses the full merged list. The visible count uses the filtered list. Filters and selection reset on reload.
- Source and contact URLs appear as selectable text. All review actions stay in the browser. Running the prototype requires no account, credentials or outreach service.

## Verification and AI use

Codex implemented the app and tests, ran the fixture checks, and exercised the inbox with Playwright in clean Chrome. The browser checks cover missing contacts, row-specific details, filter-driven deselection, draft isolation, the four statuses, counters, and persistence across reloads. The rule tests cover ID uniqueness, sort ties, all filters together, blank and null names, and the exact rating boundary. The original and workspace fixture had the same SHA-256 digest.

On 24 November 2026, Codex cloned the public repository into a new directory on Windows and followed the commands above with Node 25.8.2 and npm 11.11.1. The locked install, unit tests, lint, production build, and production start succeeded. The full browser walkthrough passed against that production server in a fresh Chrome context. It recorded zero off-origin requests and zero page errors. The cloned fixture matched the original byte for byte.

These checks were performed by Codex. The candidate's own manual interview rehearsal is separate.

## Scope and next day

The prototype omits accounts, a backend, synchronization across devices, and sending because the assignment calls for local review. The optional Loom was skipped in favor of a repeatable browser demo. With one more day, I would test keyboard and screen-reader navigation with reviewers, especially the transition from a selected row to its details on small screens.
