# TraderLaunchpad bots + backtesting architecture (notes)

This document summarizes the architectural analysis for building:

- A **strategy/bot builder** with a great UI (templates + customization with AI)
- **Backtesting** inside our platform (soon)
- **Deployments** that can run in **alerts-only** mode in V1, with a clean path to **broker execution** later
- Optional **export to TradeLocker**, which supports pasting **Backtrader** bot code (Python).

It is intended as a reference for drafting a detailed implementation plan later.

---

## Goals & constraints

- **Markets**: Forex + major crypto + US30 + commodities (oil/gold/silver) and similar.
- **Timeframes**: all timeframes **1 minute+**.
- **Data**: assume we can obtain “unlimited” TradeLocker history via a developer key with higher limits.
- **V1 priorities**:
  - Backtesting soon (even if simplistic at first).
  - Bot “deployment” scaffolded now but **alerts-only** initially.
  - Keep costs low and use **free vs paid** constraints to manage compute and data usage.
- **Data decision**: **store only M1**, derive 30m/1h/4h bars from that (avoid fetching multi-timeframe bars from the provider).

---

## Key product model: Plan vs Strategy vs Bot

To avoid painting ourselves into a corner, separate concepts early:

- **Trading Plan** (human process): rules, sessions, risk guardrails, journaling expectations.
- **Strategy** (machine logic): parameterized entry/exit logic + filters + sizing model.
- **Bot Deployment** (runtime instance): a specific immutable strategy revision deployed with runtime config (schedule, symbols, guardrails), running in alerts-only mode in V1 and optionally execution later.

This enables a “control room” UX without forcing the platform to treat a human plan as executable code.

---

## Strategy representation: DSL-first (not Python-first)

### Why DSL-first

TradeLocker supports pasting Python bot code and backtesting in their desktop Studio, but making Python the primary source-of-truth inside our platform introduces:

- sandboxing & security complexity (untrusted code execution)
- determinism/reproducibility problems
- harder portability to other targets (code tends to be runtime-specific)

Instead:

- **Canonical format**: a structured **Strategy DSL** (JSON/graph) with a **parameter schema**.
- **UI builder** edits DSL directly (templates + interactive wizard).
- **AI copilot** edits structured blocks + parameters and produces diffs with explanations.
- **Exporters** generate:
  - Backtrader-compatible Python for TradeLocker (and later other targets).

### TradeLocker export target

TradeLocker’s docs strongly imply bots are built with **Backtrader** (`bt.Strategy`, `params`, sizers). Export should generate:

- `class MyStrategy(bt.Strategy)`
- `params = { ... }` containing tunable knobs (including sizer settings)
- logic in `__init__` (indicators) and `next()` (decision loop)
- avoid disallowed imports/IO/network calls (their “code checks” exist and can be disabled locally, suggesting validation rules are enforced).

---

## Data plane: store only M1, derive other timeframes

### Why M1-only storage

Fetching and storing multiple timeframes per symbol multiplies provider load and storage without adding much value.

Instead:

- Ingest **M1** bars only.
- Derive **30m/1h/4h** bars deterministically from M1.

This turns the provider fetch problem from:

- 50 symbols × (1m, 5m, 30m, 1h, 4h) every minute = 250 “streams”

into:

- 50 symbols × 1m every minute = 50 “streams”

### Ingestion best practices

- Treat ingestion as **upsert**, not insert-only.
  - De-duplicate on `(symbol, openTime)` (or `(instrumentId, timeframe, openTime)`).
  - Fetch “last 2–3 bars” each minute to tolerate late revisions and short gaps.
- Maintain **watermarks** per symbol:
  - last ingested minute
  - gap detection (if bars missing, enqueue backfill)
- Backfill should be a separate job type, rate limited and idempotent.

### Deriving higher timeframes

Bucket M1 bars into timeframe windows:

- 30m bucket = floor timestamp to the 30-minute boundary
- 1h bucket = floor to hour boundary
- 4h bucket = floor to 4-hour boundary

Aggregation:

- open = first open
- high = max high
- low = min low
- close = last close
- volume = sum volume (if available)

Note: different asset classes have different session calendars (forex weekend gaps, crypto 24/7, indices/commodities session closures). V1 can derive “as bars arrive”; later add per-instrument calendars.

---

## Why Convex should not be the candle store or backtest engine

Convex is excellent for:

- product state (strategies, revisions, deployments, permissions/consent)
- job orchestration and progress
- real-time UI (alerts, job status, bot status)
- audit logs and metadata

Convex is a poor fit for:

- storing large, high-volume time-series (M1 candles for years)
- long-running backtests and parameter sweeps

**Recommendation**:

- Use Convex as **system-of-record + orchestration**.
- Use external storage for candles and external workers for compute.

---

## What ClickHouse solves (and why it’s relevant here)

With 50 symbols:

- 1 year ≈ 525,600 M1 bars per symbol
- 5 years ≈ 2.63M bars per symbol
- 50 symbols × 5 years ≈ **131M bars**
- 50 symbols × 10 years ≈ **262M bars**

The cost drivers are not “can we store it?” but:

- repeated range scans for backtests (“load all bars from T0..T1”)
- repeated aggregations and analytics across large datasets

ClickHouse is designed for:

- **columnar storage** (read only needed columns)
- **fast range scans** and aggregations
- **excellent compression** for time-series
- pre-aggregation/materialized views (e.g., 30m/1h bars)

It’s not a replacement for your transactional store; it’s an analytics/time-series workhorse.

---

## Backtesting system design (job-based)

### Backtest as an immutable job

Inputs should be immutable for determinism:

- `strategyRevisionId`
- `datasetId` (instrument/timeframe/date range + data snapshot/version)
- assumptions: spread/slippage/commission model version
- initial capital and risk model
- engine version (simulator version)

Job states:

- queued → running → succeeded/failed
- store progress, logs, timestamps

### Where compute runs

Run backtests in an **external worker runtime** (Python or Node) that:

- pulls strategy revision + parameters
- loads candles from the time-series store
- runs simulation
- writes results back to Convex (summary + references to detailed outputs)

Convex owns:

- job creation
- job queueing
- status/progress reporting to UI
- storage of summaries/metadata and alert/event outputs

---

## Bot deployments: alerts now, execution later

Treat “deployment” as a state machine / runtime instance:

- References an immutable `strategyRevisionId`
- Mode:
  - `alerts` (V1)
  - `paper` (later)
  - `live` (later)
- Schedule: typically **on bar close** (M1 or derived timeframes)
- Universe: list of instruments/symbols
- Guardrails: max alerts/day, session windows, max spread (later), kill switch triggers (later)
- Broker connection permissions:
  - read-only (alerts)
  - explicit “can trade” consent (execution later)

### Evaluation scaling model (important)

Avoid per-user polling. Use a subscription/fanout model:

- Build a shared market stream `(instrumentId, timeframe)` once.
- Evaluate all deployments subscribed to that stream at bar close.

This keeps load manageable as users grow.

---

## Cost control & tiering (free vs paid)

To keep monthly costs low, gate **compute**, not storage:

- **Backtest range**
  - free: 30–90 days
  - paid: 1–5 years
  - pro: 10+ years
- **Concurrency**
  - free: 1 queued job
  - paid: 3–5
  - pro: 10+
- **Optimization / sweeps** (expensive)
  - paid/pro only + quotas
- **Symbols per bot**
  - free: 1–3
  - paid: 10+
- **Evaluation frequency**
  - free: evaluate on 5m/15m close
  - paid: evaluate on 1m close

These controls map directly to ingestion and worker compute cost.

---

## Suggested “V1” slice that scaffolds execution

1) Strategy DSL + template gallery + guided first-plan workflow (wizard).
2) M1 ingestion + caching + gap detection + backfill jobs.
3) Derived timeframe aggregation (30m/1h/4h) from M1.
4) Backtest jobs in external worker; results stored + shown in UI.
5) Deployments evaluate at bar close and emit alerts + audit logs.
6) Execution later:
   - keep deployments + audit trail identical
   - swap output action from `emitAlert()` → `placeOrder()` gated behind explicit consent and guardrails.

