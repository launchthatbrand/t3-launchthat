# Integrations System Hardening & Runtime v1 — PRD

## Overview

Build a robust, typed, and observable integrations framework in `@/integrations` (Convex): scenarios, nodes, triggers, and actions. Goals: reliability, security of connections, strong typing/validation, first-class observability, versioning, and developer ergonomics.

## Current State (high-level)

- Modules: `apps/`, `connections/`, `scenarios/`, `nodes/`, `triggers/`, `actions/`, `automationLogs/`, `init.ts`, `lib/`.
- Flows (inferred): triggers fire → select scenarios → execute nodes (actions/data transforms) → side effects → log results.
- Gaps: loose typing in some queries (`v.any`, `v.string` for ids), no unified runtime contract for nodes/actions, limited observability model (logs only), unclear retry/idempotency policy, secrets exposure risk, limited versioning/drafts for scenarios, some `.filter()` usage vs `withIndex`.

## Objectives

- Strong contracts with Zod schemas (runtime validation) and typed registries for `actions`, `triggers`, and `nodes`.
- Reliable runtime (idempotency, retry/backoff, error taxonomy, dead-letter behavior).
- Secure handling of connections (secrets) and least-privilege access via `internalAction` only.
- First-class observability with `runs` + `logs` models and consistent correlation IDs.
- Safe editing and deploys with scenario versioning (draft/published) and node migrations.
- Query hygiene and indexing (Convex best practices).
- Developer ergonomics (config schemas, dry-run preview, UI-ready types).

## Non-Goals

- No external orchestration engine; runtime remains within Convex and its scheduler.
- No UI scope beyond basic utilities needed for testing/dry-run.

## Proposed Architecture

### 1) Data Model Additions

- `runs` table
  - Fields: `{ _id, scenarioId, status: "pending|running|succeeded|failed|cancelled", triggerKey, connectionId?, correlationId, startedAt, finishedAt? }`
  - Indexes: `by_scenario`, `by_status_and_time`, `by_correlation`.
- `logs` table
  - Fields: `{ _id, runId, nodeId?, step: number, status: "success|retryable_error|fatal_error", attempt: number, startedAt, durationMs?, errorCode?, errorMessage?, data? }`
  - Indexes: `by_run`.
- Harden `connections` (only non-sensitive fields queryable publicly). Secrets never returned from public functions.

### 2) Typed Registries & Contracts

- `actionRegistry`: entries expose `{ type, metadata, configSchema, inputSchema, outputSchema, execute(ctx, input): Promise<ActionResult> }`.
- `triggerRegistry`: entries expose `{ key, metadata, configSchema, fire(ctx, payload): Promise<TriggerResult> }`.
- `nodeRegistry`: resolves node.type to handler; validates `config` with Zod before execution.
- Shared runtime types:
  - `ActionResult = { kind: "success" | "retryable_error" | "fatal_error"; data?: unknown; error?: { code: string; message: string } }`.
  - `NodeIO`: normalized `input`/`output` envelope (includes `correlationId` and minimal metadata).

### 3) Runtime Reliability

- Idempotency: each trigger/run carries `correlationId` and optional `idempotencyKey`.
- Retries: exponential backoff with configurable max attempts for retryable errors; dead-letter after max.
- Central error taxonomy (`error.code`) for actions/triggers.
- All secret-using calls run in `internalAction` only.

### 4) Security of Connections

- Secrets encrypted at rest; decryption only in `internalAction` scope.
- Add helpers for token rotation and per-connection rate limits.
- Never return secrets in public APIs; store only masked summaries for display.

### 5) Scenario Versioning & Migrations

- `scenarios`: `{ draftConfig, publishedConfig, version, updatedAt }`.
- Node type can register an optional `migrate(oldConfig) => newConfig`.
- Publishing swaps configs atomically; runs always reference a specific version.

### 6) Indexing & Query Hygiene

- Replace `.filter()` with `.withIndex(...)` queries everywhere.
- Add/adjust indexes: `scenarios.by_enabled`, `scenarios.by_trigger`, `nodes.by_scenario`, `connections.by_app`, `runs.*` and `logs.*` (above).

### 7) Webhooks/Triggers Hardening

- HMAC signature validation (per app/connection config) and replay window (e.g., 5 minutes).
- Idempotency key enforcement on inbound events.
- Normalize inbound payload to typed shape before scenario execution.

### 8) Developer Ergonomics

- Export Zod schemas for UI forms (config editing) and share types.
- Add "dry-run" internal action for scenarios: validate graph + run without side-effects; returns node-by-node preview outputs.

### 9) React Flow Integration (Designer + Storage)

- Goal: author, edit, and visualize scenarios using React Flow; persist graph and UI state; map React Flow nodes/edges to runtime nodes/links in a modular way.
- Storage & Columns:
  - `nodes` table additions:
    - `rfType: string` — React Flow node type key; maps to `nodeRegistry` entry.
    - `rfPosition: { x: number; y: number }` — persisted node coordinates.
    - `rfLabel?: string` — display label separate from internal name.
    - `rfWidth?: number`, `rfHeight?: number` — optional layout dimensions.
  - New `scenarioEdges` table:
    - `{ _id, scenarioId: Id<"scenarios">, sourceNodeId: Id<"nodes">, sourceHandle?: string, targetNodeId: Id<"nodes">, targetHandle?: string, label?: string, animated?: boolean, style?: Record<string, unknown>, order?: number, createdAt: number, updatedAt: number }`
    - Indexes: `by_scenario (scenarioId)`, `by_source (sourceNodeId)`, `by_target (targetNodeId)`.
  - `scenarios.uiState`:
    - `{ viewport: { x: number; y: number; zoom: number }, selectedNodeIds?: Id<"nodes">[] }`.
- Mapping rules:
  - `rfType` ↔ `nodeRegistry.type`; node `config` validated with its `configSchema`.
  - Edges define execution flow. Conditional edges may use `label` (e.g., "true"/"false") or `sourceHandle` to branch.
  - Runtime enforces DAG (no cycles). Validate at save-time; reject cyclic graphs.
  - Handle names must be declared by node types; validate edges against node capabilities.
- APIs:
  - Batch upserts: `upsertScenarioGraph({ nodes, edges, uiState })` with full validation.
  - Queries: `getScenarioGraph(scenarioId)` returns `{ nodes, edges, uiState }` in React Flow-friendly shape.
  - Dry-run uses the stored graph; returns per-node preview outputs and flow taken.

## API Changes (examples)

- Public queries: tighten validators (`v.id("...")`, no `v.any()` returns).
- `integrations/connections`: consolidate duplicated exports; one canonical module exposing safe queries/mutations.
- New internal actions for secret usage and webhook verification.

## Migration Plan

1. Create `runs` and `logs` tables + indexes; instrument existing triggers/actions to write
   basic entries.
2. Introduce registries (actions/triggers/nodes) and switch existing implementations to them.
3. Update `connections` access: secrets only readable within `internalAction`.
4. Add scenario versioning with draft/publish; provide minimal migration helpers per node.
5. Replace `.filter()` calls; add missing indexes.
6. Harden webhooks (signatures, replay, idempotency); add inbound normalization.

## Risks & Mitigations

- Backward compatibility: publish drafts alongside current behavior; migrate gradually.
- Performance impact from validation/logging: index judiciously, use pagination, batch logs.
- Secret handling bugs: isolate in internal actions, add integration tests.

## Observability & Testing

- Each run gets a `runId`; all steps logged with `attempt`, `durationMs`, and structured errors.
- Add unit tests for registries, migrations, webhook verification, retry policies.

## Acceptance Criteria

- Strongly-typed registries for actions/triggers/nodes with Zod-validated configs.
- New `runs` and `logs` tables with indexes; runs visible by scenario and status.
- Idempotency + retry/backoff implemented; dead-letter recorded.
- Secrets never exposed via public queries; decrypted only in internal actions.
- Scenario draft/published versioning active; publishing is atomic.
- All hot paths use `withIndex`; `.filter()` removed from server-side data fetches.
- Webhook signature verification + replay protection enforced.
- A dry-run internal action returns a node-by-node preview without side effects.
- React Flow authoring supported: persisted positions, types, edges, and UI state; graph validation prevents cycles and invalid handles.

## Milestones

1. Data model + logging (runs/logs) and index hygiene
2. Registries + runtime contract (idempotency/retries)
3. Security of connections (internalAction-only secret usage)
4. Scenario versioning + migrations
5. Webhook hardening + dry-run utility
6. React Flow graph persistence (nodes/edges/uiState) + graph validation
