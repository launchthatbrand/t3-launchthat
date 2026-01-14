# TraderLaunchpad Journal + TradeIdeas (Design Notes)

This document captures the current design direction for the TraderLaunchpad “Journal” experience:

- A private, logged-in journal UI at `/journal/*`
- Public shareable journal pages (and a future leaderboard)
- TradeIdeas as **first-class domain entities** (not post types), **auto-generated** from broker trades
- Discord emission rules aligned with “public journal” toggles and org roles

---

## Goals

### Product goals
- **Private journal**: logged-in users can view and control their TradeLocker-linked trading data and account state.
- **Public journal**: each user has a share link that exposes their journal to anyone (logged in or out) when enabled.
- **Leaderboard**: aggregate public stats and make them viewable logged in or out.
- **Discord streaming**:
  - Org-owned “Admin Trades” accounts can stream to an Admin channel.
  - Member-linked accounts can stream to a Members channel.
  - Users may disable public + Discord streaming while still keeping private analytics.

### Technical goals
- Keep broker-ingested data **high-integrity and queryable** (real tables + indexes).
- Avoid forcing high-churn trade state into the post-type/meta system.
- Make TradeIdeas derived state **idempotent**, **deterministic**, and **hedging-safe**.

---

## Routing strategy (LMS-style resolver)

The portal uses a frontend catch-all route plus a plugin route handler filter:

- Catch-all: `apps/portal/src/app/(root)/(frontend)/[...segments]/page.tsx`
- Resolver: `apps/portal/src/lib/frontendRouting/resolveFrontendRoute.tsx`
- Extension point: `FRONTEND_ROUTE_HANDLERS_FILTER` in `apps/portal/src/lib/plugins/hookSlots.ts`

### Private journal routes (logged-in “behind the scenes”)
- `/journal/dashboard`
- `/journal/orders`
- `/journal/settings`

These are **application routes**, not post routes; they should be handled by a TraderLaunchpad route handler that returns React nodes for these pages.

### Public journal routes (viewable logged in or out)
We can support either (or both):
- `/journal/u/{username}/...`
- `/u/{username}/journal/...`

Public routes should be resolved by a TraderLaunchpad route handler that:
- resolves `{username → userId}` (and org scope if applicable)
- checks the user’s `journalProfiles.isPublic`
- renders a **read-only public journal** view when enabled, otherwise shows “Journal is private”.

### Why these are not post types
Dashboard/orders/settings and public journal pages are an application surface over domain data. Post types are best for editorial content with templates, meta, and archives. Trading data is high-churn operational data and should be modeled as domain tables.

---

## Privacy and streaming rules (per-user toggle)

### Requirement
“Per-user toggle for now, default everything public. If not public, do not send to notification/discord. Still allow private analytics.”

### Proposed source of truth
Add a single per-user setting row:

**`journalProfiles`**
- `organizationId`
- `userId`
- `isPublic` (default `true`)
- optional future knobs: `delayMinutes`, `showSymbols`, `showOpenPositions`, etc.

### Discord gating
Before posting any trade updates to Discord for a user-owned connection:
- load `journalProfiles.isPublic`
- if `false` → skip Discord emission
- ingestion continues privately

### Org-owned “Admin Trades” accounts
Org-owned broker connections should not be controlled by a single user’s share toggle. For org-owned accounts:
- Discord routing is controlled by org config (e.g. always stream to Admin channel)
- Data can still be shown to org admins in private views.

This implies a connection-level ownership indicator:
- `ownerKind: "org" | "user"` (or equivalent)

---

## Data model: raw ingest vs public/published surfaces

### Raw ingest tables (private)
These represent broker-aligned raw state and should remain private:
- `tradelockerConnections`
- `tradeOrders` (open/pending)
- `tradeOrdersHistory` (final statuses)
- `tradePositions` (current open positions)
- `tradeExecutions` (fills/executions)
- `tradeAccountStates` (account state payload + parsed accountDetailsData)

### Public surfaces (initial vs mature)
There are two phases:

#### Phase 1 (fast path)
Public pages can read from raw tables but must **strictly project safe fields** and never return `raw` blobs. This is workable for early iterations but requires careful whitelisting.

#### Phase 2 (recommended for stability + leaderboard)
Add a “published/sanitized” layer:

**`journalPublishedTrades`**
- Contains *safe* and *stable* snapshots used by public pages + leaderboard.
- Enables privacy transforms (e.g. hide symbols, delay updates) without touching raw ingest.

**`journalLeaderboardStats`**
- Materialized stats for performance + caching.
- Can be updated via cron or incremental updates.

---

## TradeIdeas: first-class domain entities (not post types)

### Requirement recap
TradeIdeas are auto-generated from broker trades:
- Example 1: one USDJPY roundtrip (buy → sell) → **one TradeIdea**
- Example 2: scale-in/out over days (4 buys, 4 sells) → **one TradeIdea**
- TradeLocker does not have a “trade idea” concept; it’s portal-only content derived from broker activity.

### Why not a post type for TradeIdeas
TradeIdeas are **derived trading state**:
- updated frequently as executions arrive
- require numeric fields and indexes
- should be deterministic and idempotent

Post types are optimized for editorial content; using `postsMeta` for a moving trading state increases complexity, reduces type safety, and makes indexing/filtering harder.

### Adding rich notes later
There are two compatible options:
1) store simple `notes` fields directly on `tradeIdeaGroups` (basic)
2) add a separate `tradeIdeaNotes` post type later for rich editing, and link it to `tradeIdeaGroups` by id

Crucially: **the grouping and lifecycle tracking remains in domain tables.**

---

## Hedging: grouping must be position/thread aware

### Constraint
“Hedging is possible” means the user can have simultaneous long and short exposure in the same symbol/account, and potentially multiple independent position threads.

Therefore, the classic “netQty per symbol” grouping is insufficient.

### Correct grouping key (preferred)
Use a broker-provided position/thread identifier:
- `positionId` (from `/trade/accounts/{accountId}/positions`)
- and/or an execution field like `positionId`, `posId`, `tradeId`, etc. if present in executions payload

**TradeIdea group key (hedging-safe):**
- `(organizationId, userId, connectionId, accountId, positionId)` as primary key
- Keep `symbol` for display and searching

### Reality check (TradeLocker payloads)
Current ingestion already captures:
- `tradePositions.externalPositionId` from `row.positionId ?? row.posId ?? row.id`

However, current execution normalization does **not** explicitly extract `positionId`. In the next implementation phase, we should:
- extend execution normalization to also capture `positionId`/`posId`/`tradeId` if present
- store it in `tradeExecutions` (e.g. `externalPositionId`)

If the execution feed truly does not include a position id, we need a fallback strategy (less ideal), e.g.:
- per-symbol direction buckets + FIFO lots (complex and broker-specific)
- or resolving execution → position by matching instrument + close/open windows (heuristic; error-prone)

The design assumes we can get a position/thread identifier from TradeLocker (most brokers provide it).

---

## TradeIdea lifecycle algorithm (hedging-safe)

### High level
For each broker “position thread” (positionId):
- **Open group** when the position thread appears/opened
- **Append executions** as they occur
- **Close group** when that position thread is closed

### Data sources
- `/positions`: authoritative list of currently open positions + their `positionId`
- `/ordersHistory` + `/executions`: authoritative list of fills/executions used for linking and PnL computation

### Linking strategy (avoid arrays on the group)
Introduce a join table to link executions/orders into the TradeIdea:

**`tradeIdeaEvents`** (name flexible)
- `tradeIdeaGroupId`
- `tradeExecutionId` (or `externalExecutionId`)
- optional `externalOrderId`
- optional `externalPositionId`
- `executedAt`
- indexes: `by_tradeIdeaGroupId`, `by_externalExecutionId`, `by_externalOrderId`, `by_externalPositionId`

### Computation
Within a single position thread:
- track signed qty changes from executions (buy/sell)
- compute avg entry price, realized pnl, fees
- when thread closes, finalize and mark `closedAt`

Because hedging can create multiple concurrent threads for the same symbol, the algorithm is run **per positionId**, not per symbol.

### Ordering / idempotency
Process executions in ascending time:
- sort by `(executedAt, externalExecutionId)` as a stable tie-breaker
- store a cursor on the group (e.g. `lastProcessedExecutionId` and/or `lastExecutionAt`)
- do not re-apply executions that have already been linked

---

## Public journal + TradeIdeas visibility

### Public journal is enabled per user (default on)
When `journalProfiles.isPublic === true`:
- public pages can display:
  - account stats (with safe projections)
  - closed and open positions (per your requirement)
  - TradeIdeas (open + closed) once implemented

When `false`:
- public pages show “Journal is private”
- Discord streaming is disabled for user-owned connections

### Future safety toggles (recommended)
Because open positions are public and hedging exists:
- consider `delayMinutes` (e.g. 15–60 minutes) to reduce copy-trade risk
- consider `showOpenPositions` toggle
- consider `showSymbols` toggle (performance-only view)

---

## Suggested implementation phases

### Phase 1: Journal routes
- Add TraderLaunchpad frontend route handler for `/journal/*` (private).
- Add public handler for `/journal/u/{username}/*` (public) with `isPublic` gating.

### Phase 2: User journal profile + Discord gating
- Add `journalProfiles` with `isPublic` default true
- Gate Discord emission based on `isPublic` for user-owned accounts
- Add UI toggle in `/journal/settings` (and/or plugin settings) to disable public

### Phase 3: TradeIdeas (hedging-safe)
- Extend execution ingestion to capture `positionId`/`tradeId` if available
- Create `tradeIdeaGroups` keyed by position thread
- Create `tradeIdeaEvents` join table for linking
- Build UI: `/journal/ideas` and details views (private + public when enabled)

### Phase 4: Leaderboard
- Build `journalPublishedTrades` and `journalLeaderboardStats`
- Add `/journal/leaderboard` public route

---

## Open questions (to resolve during implementation)
- Which TradeLocker field represents the stable position thread id in executions? (`positionId`? `tradeId`? another column id?)
- Should org-owned “Admin Trades” always stream regardless of user toggle? (likely yes)
- Public safety defaults: introduce delay? allow hiding symbols? allow hiding open positions?


