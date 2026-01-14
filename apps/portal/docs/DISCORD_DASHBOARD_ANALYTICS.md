---
title: Discord Dashboard Analytics System
description: End-to-end design for Discord analytics (ingestion → rollups → AI insights) stored in component-scoped Convex tables.
---

## Overview

This document describes a **Discord Dashboard Analytics** system for Portal’s Discord plugin.

- **Scope**: Analytics for **all channels** in a guild (no allowlist).
- **Storage**: All analytics data lives in **Discord component-scoped tables** (e.g. `components.launchthat_discord.analytics.*`).
- **Goal**: Produce **deep, queryable, time-bucketed metrics** that power:
  - a Dashboard UI (top channels, active members, top content),
  - and **structured analytics payloads** that can be fed into AI for insights + automation.

The design is intentionally layered:

1. **Ingestion**: Capture raw, normalized events (messages, reactions, threads, member changes).
2. **Rollups**: Maintain query-friendly aggregates (daily/weekly/monthly, plus “top lists”).
3. **AI Integration**: Provide a stable “analytics summary” contract that the AI can use.

---

## Part 1 — Ingestion

### Why ingestion is required
Discord does not provide a complete “analytics history” API. If you want “deep data”, you must **collect events over time** and build your own analytics warehouse.

### Sources of truth

- **Gateway worker** (recommended primary):
  - Receives real-time events and pushes them to Convex via the existing relay/http action.
  - Best for correctness and near-real-time rollups.

- **REST polling** (optional supplement):
  - Periodic reconciliation (e.g., nightly) for drift correction or missing events.
  - Helpful for “top channels” and member snapshots.

### Events to ingest (v1)

**Message-level**
- Message created (`MESSAGE_CREATE`)
  - channelId / threadId, authorId, timestamp
  - content excerpt (optional), attachments count, embeds count, mentions count
- Message deleted (`MESSAGE_DELETE`) *(optional for v1, useful for accuracy)*
- Message updated (`MESSAGE_UPDATE`) *(optional for v1, useful for accuracy)*

**Reactions**
- Reaction add/remove (`MESSAGE_REACTION_ADD` / `MESSAGE_REACTION_REMOVE`)
  - messageId, emoji, reactorId, timestamp
  - This is essential for “most liked content”.

**Threads & forums**
- Thread created (`THREAD_CREATE`)
- Thread updated (`THREAD_UPDATE`) *(optional)*
- Thread deleted (`THREAD_DELETE`) *(optional)*

**Members**
- Member joins/leaves (`GUILD_MEMBER_ADD` / `GUILD_MEMBER_REMOVE`)
- Role updates (`GUILD_MEMBER_UPDATE`) *(optional, if you want role-based segmentation)*

### Normalization rules

To keep ingestion fast and safe:

- **Always include**: `organizationId`, `guildId`, `eventType`, `eventId`, `eventAt`
- **Use stable identifiers**:
  - `channelId`, `threadId`, `messageId`, `userId` (Discord IDs as strings)
- **Avoid huge payloads**:
  - store a short `contentExcerpt` (e.g., 280–500 chars) rather than full message content
  - store counts and metadata (attachmentCount, mentionCount, hasEmbeds, etc.)
- **Idempotency**:
  - ensure duplicates are safe (worker retries, gateway reconnects)
  - dedupe via a composite key: `guildId + eventType + eventId`

### Suggested component-scoped tables (raw)

All tables below are in the Discord component scope (names illustrative).

#### `analyticsEvents`
Stores normalized raw events (append-only).

Fields:
- `organizationId: string`
- `guildId: string`
- `eventType: "message_create" | "message_delete" | "reaction_add" | ...`
- `eventId: string` (e.g. messageId, reaction event composite id)
- `eventAt: number`
- `channelId?: string`
- `threadId?: string`
- `messageId?: string`
- `authorDiscordUserId?: string`
- `reactorDiscordUserId?: string`
- `emoji?: string`
- `contentExcerpt?: string`
- `meta?: Record<string, string | number | boolean | null>`

Indexes:
- `by_guildId_and_eventType_and_eventAt`
- `by_guildId_and_channelId_and_eventAt`
- `by_guildId_and_messageId`
- `by_guildId_and_eventType_and_eventId` (for dedupe)

#### `messageFacts`
A denormalized “message facts” table for quick top-content calculations (optional but recommended).

Fields:
- `organizationId`, `guildId`
- `messageId`, `channelId`, `threadId?`
- `authorDiscordUserId`
- `createdAt`
- `contentExcerpt?`
- `reactionCount` (optional cached counter)
- `uniqueReactorsCount` (optional cached counter)

Indexes:
- `by_guildId_and_channelId_and_createdAt`
- `by_guildId_and_messageId`

#### `reactionFacts`
If you want precise unique reactor sets without scanning all events.

Fields:
- `organizationId`, `guildId`
- `messageId`
- `emoji`
- `reactorDiscordUserId`
- `createdAt`
- `removedAt?`

Indexes:
- `by_guildId_and_messageId`
- `by_guildId_and_reactorDiscordUserId_and_createdAt`

> Note: You can implement reactions either as raw event deltas only, or as facts + counters. Facts cost more writes but make unique reactor counts easier.

### Backfill (optional)

If you want “some history”, implement a controlled backfill:

- Backfill last **N days** (e.g., 7–30) by paging messages per channel via REST.
- Rate-limited and resumable, per guild.
- After backfill, rely on gateway ingestion for ongoing events.

Given the user requirement (**all channels**), backfill should likely be:
- opt-in per org (to avoid a surprise explosion in API usage),
- with configurable depth (7/14/30 days),
- and strong rate limiting.

---

## Part 2 — Rollups

### Why rollups
Dashboards should not query raw events. Rollups provide:
- fast UI queries,
- stable time-window comparisons,
- cheap “top lists” (channels/members/content),
- an easy analytics feed for AI.

### Time bucketing strategy
Use day buckets as the base, and derive week/month in queries or secondary rollups.

Define a canonical bucket key:
- `bucket = floor(timestamp / 86_400_000)` (UTC day)

Store:
- `bucketStartAt = bucket * 86_400_000`
- `bucketEndAt = bucketStartAt + 86_400_000`

### Rollup tables (recommended)

#### `channelDailyRollups`
One row per `guildId + channelId + dayBucket`.

Fields:
- `organizationId`, `guildId`, `channelId`
- `bucketStartAt`
- `messageCount`
- `uniqueAuthorCount` *(approx or exact; exact needs author-set tracking)*
- `reactionAddCount`
- `uniqueReactorCount`
- `threadCreateCount` *(forums/threads)*
- `updatedAt`

Indexes:
- `by_guildId_and_bucketStartAt`
- `by_guildId_and_channelId_and_bucketStartAt`

#### `memberDailyRollups`
One row per `guildId + userId + dayBucket`.

Fields:
- `organizationId`, `guildId`, `discordUserId`
- `bucketStartAt`
- `messagesSent`
- `reactionsAdded`
- `threadsStarted`
- `updatedAt`

Indexes:
- `by_guildId_and_bucketStartAt`
- `by_guildId_and_discordUserId_and_bucketStartAt`

#### `topContentDaily`
Stores references to “top content” per day bucket. (Helps “most liked content”.)

Fields:
- `organizationId`, `guildId`
- `bucketStartAt`
- `messageId`
- `channelId`
- `authorDiscordUserId`
- `reactionScore` (e.g., total reactions; optionally weighted)
- `contentExcerpt?`
- `jumpUrl?` (prebuilt Discord link, if available)

Indexes:
- `by_guildId_and_bucketStartAt`
- `by_guildId_and_messageId`

### Rollup update approach

**Preferred**: Roll up on ingestion via mutations:

- On `message_create`:
  - increment `channelDailyRollups.messageCount`
  - increment `memberDailyRollups.messagesSent`
  - optionally update `messageFacts`

- On `reaction_add/remove`:
  - increment/decrement `reactionAddCount` as a delta
  - update message reaction counters (optional)
  - update `topContentDaily` candidates (optional)

- On `thread_create`:
  - increment `channelDailyRollups.threadCreateCount`
  - increment `memberDailyRollups.threadsStarted`

**Alternative**: Append raw events, then run a scheduled aggregator.
This is simpler but introduces delay and requires scanning events.

### “Most popular channels”, “most active members”, “most liked content”

These become simple queries over rollups for a given window:

- Window examples: `last_7_days`, `last_30_days`, `custom range`

**Popular channels**:
- rank by `sum(messageCount)` and/or `sum(reactionAddCount)`

**Active members**:
- rank by `sum(messagesSent)` and/or `sum(reactionsAdded)`

**Liked content**:
- rank by `reactionScore` from `topContentDaily` aggregated across the window

### Data quality notes

- “Unique author/reactor counts” can be:
  - **exact** if you store sets (expensive),
  - **approx** if you store hashed IDs and count distinct (still expensive),
  - or **skip in v1** and add later.
For v1, message and reaction totals are already very actionable.

---

## Part 3 — AI Integration

### Guiding principle
AI needs a **stable, structured analytics payload**—not raw tables—so you can evolve the storage without breaking downstream prompt logic.

### Provide an “analytics summary” contract
Add a single function that returns:
- high-signal metrics,
- top lists,
- window comparisons,
- and “derived insights primitives” that AI can reason over.

Example shape (illustrative):

```json
{
  "guildId": "123",
  "window": { "kind": "last_7_days", "startAt": 123, "endAt": 456 },
  "topChannels": [
    { "channelId": "c1", "name": "#general", "messageCount": 1200, "reactionCount": 340 }
  ],
  "topMembers": [
    { "discordUserId": "u1", "name": "alice", "messagesSent": 220, "reactionsAdded": 80 }
  ],
  "topContent": [
    { "messageId": "m1", "channelId": "c2", "reactionScore": 52, "excerpt": "..." }
  ],
  "supportSignals": {
    "escalations": 12,
    "unansweredThreads": 7,
    "commonKeywords": [{ "keyword": "refund", "count": 9 }]
  }
}
```

### “Insights” vs “Actions”
Keep AI outputs separable:

- **Insights**: summaries, hypotheses, patterns (no side effects)
- **Actions**: create a scheduled announcement, propose a weekly challenge, draft content outline

This maps nicely to:
- `analyticsSummaryQuery` (query)
- `generateInsightsAction` (action)
- `suggestionDraftsAction` (action)

### Feeding AI safely

Recommended constraints:
- Provide only aggregate data + excerpts (not full message content) by default.
- If you later add semantic clustering, store embeddings and only provide cluster summaries.
- For personal data, keep it org-scoped and respect privacy settings.

---

## Dashboard UI (default tab)

### Requirements
- Discord plugin has a **Dashboard tab** as the default page.
- Dashboard includes a **guild switcher** (org switcher UX, but for `guildConnections`).
- Shows:
  - Most popular channels
  - Most active members
  - Most liked content
  - (Later) trending topics, support signals

### Suggested cards (v1)
- **Window selector**: 7d / 30d / 90d
- **Activity chart**: messages + reactions per day
- **Top channels**: rank by messages, rank by reactions
- **Top members**: rank by messages + reactions
- **Top content**: top reacted messages (with deep link)

### Guild switcher behavior
- List all guild connections for the org.
- Persist selection (URL param + local storage):
  - `.../admin/discord/dashboard?guildId=...`

---

## Gamification & engagement use cases (powered by analytics)

These are concrete loops that convert analytics into retention and content velocity.

### 1) Weekly “Market Thesis Challenge”
- **Inputs**: top topics/channels, top questions, activity peaks
- **Output**: bot posts 3 prompts + rubric; community reacts/votes
- **AI**: draft prompts, summarize submissions, produce weekly recap

### 2) Streaks (learning + participation)
- **Inputs**: per-member activity rollups (messages, reactions, threads started)
- **Output**: streak role + leaderboard + weekly rewards
- **AI**: personalized practice suggestions based on engagement patterns

### 3) Auto-scheduled Office Hours
- **Inputs**: spikes in questions + “confusion topics”, time-of-day heatmap
- **Output**: recommended schedule + session agenda
- **AI**: agenda generation + recap + next-week action items

### 4) “Top Setups of the Week” digest
- **Inputs**: top reacted content in #setups (or all channels, filtered by heuristics)
- **Output**: weekly digest embed/carousel
- **AI**: classify setup type, add education/risk notes

### 5) Community mentors program
- **Inputs**: members with high replies + positive reactions; faster response rates
- **Output**: grant Mentor role; bot pings mentors when unanswered questions spike
- **AI**: route questions to likely mentors; propose recognition recipients monthly

### 6) Personalized “Practice Plan”
- **Inputs**: per-member topic clusters (later), activity signals
- **Output**: opt-in DM plan and weekly tasks
- **AI**: generate plan + track progress with check-ins

---

## Implementation notes (v1 focus)

### Start simple but future-proof
For v1:
- Capture **messages + reactions + threads**.
- Store daily rollups for channels and members.
- Build “top lists” from rollups.

Then iterate:
- topic extraction (keywords → embeddings → clustering),
- richer “support signals” (escalations, resolution time, top issues),
- AI “suggestion generator” actions.

### All channels: performance & cost
Since analytics are for **all channels**, keep data manageable:
- store excerpts, not full content
- store rollups aggressively
- keep raw events retention bounded (e.g., 30–90 days) once rollups are validated



