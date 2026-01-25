---
name: Discord Channel Routing Builder
overview: Add a modular, guild-scoped channel routing rule system with searchable Discord channel selection and a simple rule builder UI for per-event trade streaming. Keep Discord API access and domain-specific predicates in the app layer while the discord plugin provides storage, evaluation helpers, and reusable UI scaffolding.
todos:
  - id: routing-v2-schema
    content: Add plugin-owned routingRuleSets + routingRulesV2 tables (and optional guildChannelCatalog) with CRUD queries/mutations.
    status: pending
  - id: discord-channel-catalog
    content: Add app-layer action to fetch guild channels from Discord API and surface them to the UI (optional caching).
    status: pending
  - id: routing-evaluator
    content: Implement v2 routing resolver query supporting matchStrategy and per-event context (actorRole, symbol).
    status: pending
  - id: ui-channel-picker
    content: Create a reusable searchable Discord channel picker (Command+Popover) component.
    status: pending
  - id: ui-rule-builder
    content: Replace guild /channels page with a rule builder UI (conditions + channel target + enable + ordering + matchStrategy).
    status: pending
  - id: delivery-integration
    content: Update trade streaming delivery to resolve channels via v2 rules and support multi-cast/priority, with backward-compat fallback.
    status: pending
isProject: false
---

## Goals

- Add a **searchable Discord channel picker** (dropdown + search) when configuring routing.
- Replace the current “channel mapping” form with a **rule builder** that can express rules like:
- member trade with symbol=AUDJPY → Channel 1
- admin trade (any symbol) → Channel 2
- admin trade with symbol=BTCUSD → Channel 3
- Rules are evaluated **per event** (per trade/trade idea message).
- Matching strategy is **configurable by admins** (first-match / multi-cast / priority).
- Make the builder **reusable across standalone apps** by keeping:
- UI + rule storage in the discord plugin
- Discord REST calls (list channels) + domain predicates (e.g. “symbol”, “actor role”) in the host app.

## Current baseline (what we’ll evolve)

- Trade feed routing today is role-only and uses a single “channelKind” mapping:
- Portal streams trade ideas via `discordRoutingQueries.resolveTradeFeedChannel` + `guildSettings.mentorTradesChannelId/memberTradesChannelId` (see `apps/portal/convex/plugins/traderlaunchpad/discord.ts`).
- Plugin schema has limited routing in `routingRules` (`kind="trade_feed"`, `channelKind=mentors|members`) and no mutation/UI for complex conditions (see `packages/launchthat-plugin-discord/src/convex/component/schema.ts`).

## Design

### 1) Routing rules v2 (plugin-owned)

- Add new plugin tables (leave existing `routingRules` for backward compatibility):
- `routingRuleSets` (per org + guild + kind): stores `matchStrategy` and defaults.
- `routingRulesV2` (per org + guild + kind): stores ordered rules with:
- enabled flag
- order/priority
- target `channelId`
- optional `templateId`
- **conditions** as a validated discriminated union (start small and extensible):
- `actorRole in [admin, member, …]`
- `symbol in ["BTCUSD", "AUDJPY", …]`

### 2) Evaluation (plugin helper)

- Add a plugin query like `routing/queries:resolveChannelForEventV2` that takes:
- `organizationId`, `guildId`, `kind`
- `eventContext` (per-event fields, e.g. `{ actorRole, symbol }`)
- Implement match strategy:
- `first_match`: first enabled rule whose conditions match
- `multi_cast`: return all matching channelIds
- `priority`: return max priority (then stable order)
- Backward-compat fallback:
- If no v2 rules exist, fall back to existing `resolveTradeFeedChannel` behavior.

### 3) Discord channel list (app-layer)

- Add an app-layer action in TraderLaunchpad to fetch channels from Discord:
- e.g. `apps/traderlaunchpad/convex/discord/actions.ts`: `listGuildChannels({ organizationId, guildId })`
- Uses resolved bot token (env/secrets) and Discord REST `GET /guilds/{guildId}/channels`.
- Provide optional caching:
- Add plugin-owned table `guildChannelCatalog` (guildId, updatedAt, channels[]), updated via a plugin mutation.
- UI reads catalog via plugin query; UI has a “Refresh” button that calls the app action.

### 4) Rule builder UI (plugin reusable, app-configured)

- Replace current guild channels page with a rule-builder page rendered in focused mode:
- Route already exists: `/.../discord/guilds/<guildId>/channels`.
- UI features:
- **Channel picker**: searchable dropdown using existing `Command` + `Popover` patterns (see `packages/ui/src/country-dropdown.tsx` and `packages/ui/src/command.tsx`).
- **Rules list**: add/remove rules, enable toggle, reorder (simple up/down buttons first).
- **Conditions UI**:
- Actor role: multi-select
- Symbol: multi-select with search (from app-provided symbol list)
- **Match strategy selector** at top (stored in `routingRuleSets`).
- Modularity mechanism:
- Add `routingCatalog` (or similar) prop to `DiscordAdminRouter` / page component:
- defines available condition types + how to render inputs
- provides option sources (roles list, symbol list)
- TraderLaunchpad supplies:
- role options (owner/admin/editor/member)
- symbol options (from its instruments table)

### 5) Wire delivery to v2 rules (app changes)

- Update the trade streaming pipeline to use v2 routing resolution:
- In `apps/portal/convex/plugins/traderlaunchpad/discord.ts`, replace role-only routing with:
- `eventContext = { actorRole, symbol }`
- resolve channel(s) via the plugin v2 resolver
- post/patch to each channel if multi-cast is enabled
- Keep existing template rendering, but allow v2 rule to override templateId (optional).

## Milestones / Todos

- **routing-v2-schema**: Add `routingRuleSets` + `routingRulesV2` (and optional `guildChannelCatalog`) to `packages/launchthat-plugin-discord/src/convex/component/schema.ts`, plus queries/mutations to CRUD.
- **discord-channel-catalog**: Add TraderLaunchpad app action to fetch channels from Discord and write/read catalog.
- **routing-evaluator**: Implement v2 routing resolver query with matchStrategy.
- **ui-channel-picker**: Build reusable searchable channel picker component using `Command`/`Popover`.
- **ui-rule-builder**: Build focused guild `/channels` page that edits v2 rules and matchStrategy.
- **delivery-integration**: Update Portal TraderLaunchpad Discord streaming to use v2 routing; preserve fallback.

## Verification

- In org admin → Connections → Discord → guild → Channels:
- Can search-select a guild channel.
- Can create the three example rules.
- Switching match strategy changes behavior.
- Trigger streaming:
- Admin BTCUSD trade → routes to BTCUSD admin channel (rule 3) or to both (if multi-cast).
- Admin non-BTCUSD trade → routes to Channel 2.
- Member AUDJPY trade → routes to Channel 1.
- Member non-AUDJPY trade → falls back or routes per remaining rules.
