# Portal Plugin System (Standard)

This repo’s “Portal plugins” are **package-level feature suites** implemented as `packages/launchthat-plugin-*` packages, consumed by the Portal app (`apps/portal`). A plugin primarily provides a **`PluginDefinition`** (from `launchthat-plugin-core`) describing:

- Post types to provision (and how they behave)
- Settings pages
- Admin menu entries
- Hook registrations (via `@acme/admin-runtime/hooks`)
- Optional providers to wrap plugin-rendered UI
- Optional activation config (backed by Convex `core.options`)

This document defines the **standard template** all portal plugins should follow going forward.

---

## Where plugins plug into the Portal

### 1) Composition (single source of truth)

Portal composes all plugin definitions in:

- `apps/portal/src/lib/plugins/definitions.tsx`

This is the authoritative list used throughout portal for:

- Admin plugin enable/disable UI (`/admin/plugins`)
- Admin menu construction
- Frontend routing (archive/single slugs)
- Notification catalog
- Hook installation
- Provider registry

### 2) Hook installation

Portal registers plugin hooks once via:

- `apps/portal/src/lib/plugins/installHooks.ts`
- `apps/portal/src/lib/plugins/registerHooks.ts`

Plugins provide hooks through `PluginDefinition.hooks.actions/filters`, which get registered using `@acme/admin-runtime/hooks` `addAction` / `addFilter`.

### 3) Frontend providers

Portal has a provider registry and wrapper:

- `apps/portal/src/lib/plugins/frontendProviders.tsx`

It aggregates `plugin.providers` (a providerId → ProviderComponent mapping) and wraps frontend render output based on `postType.frontend.providers` (a list of provider IDs).

### 4) Activation / enablement

Enablement is currently governed by:

- Post types existing/being accessible for the current org/tenant
- Optional activation config (`PluginDefinition.activation`) stored in Convex `core.options`

See `apps/portal/src/app/(root)/(admin)/admin/plugins/page.tsx` and `apps/portal/src/lib/adminMenu/useAdminMenuSections.ts`.

---

## The standard plugin package template

### Required folder structure

Each portal plugin must be a package under:

- `packages/launchthat-plugin-<id>/`

Minimum structure:

```
packages/launchthat-plugin-<id>/
  package.json
  tsconfig.json
  src/
    index.ts            // re-exports public surface
    plugin.ts           // NO JSX; defines PLUGIN_ID + create…Definition()
    admin/              // admin-only UI, meta boxes, settings screens
    frontend/           // frontend UI (archive/single renderers, widgets)
    context/            // React context/providers (or providers/)
    providers/          // optional alternative to context/
    convex/             // only if plugin ships convex/component code
```

### Required exports (consistent across all plugins)

In `src/plugin.ts`:

- `export const PLUGIN_ID = "<id>" as const;`
- `export type PluginId = typeof PLUGIN_ID;` (optional but recommended)
- `export const create<PluginName>PluginDefinition = (options?: …): PluginDefinition => ({…})`
- `export const <camel>Plugin = create<…>PluginDefinition(defaultOptions);`

In `src/index.ts`:

- `export { PLUGIN_ID, create<…>PluginDefinition, <camel>Plugin } from "./plugin";`
- `export default <camel>Plugin;`

### Naming rules

- **plugin id**: `PluginDefinition.id` MUST equal `PLUGIN_ID` and match the package suffix.
  - Example: `packages/launchthat-plugin-support` → `PLUGIN_ID = "support"` → `plugin.id = "support"`
- **activation option key**: use `plugin_<id>_enabled` (site by default) unless there’s a documented reason not to.
- **IDs inside settings pages / tabs / meta boxes** should be namespaced (recommended):
  - `"<id>.<domain>.<thing>"` for renderers, or `"<id>-<thing>"` for simpler IDs

### Hook slots: no raw strings

Plugins MUST import hook slot constants from `launchthat-plugin-core/hookSlots` instead of hardcoded string literals.

Example:

```ts
import { ADMIN_ARCHIVE_HEADER_BEFORE } from "launchthat-plugin-core/hookSlots";
```

---

## Recommended patterns (to standardize)

### 1) Keep plugin definitions pure (no global mutation)

Avoid module-level mutable globals like:

- `export let plugin = createDefinition()`
- `export const configurePlugin = (…) => { plugin = createDefinition(overrides) }`

Instead, export the pure factory and let portal compose the instance it needs in `apps/portal/src/lib/plugins/definitions.tsx`.

### 2) Portal-specific providers are injected by portal, not by plugin globals

If a plugin needs a portal-owned provider (e.g. a provider implemented in `apps/portal`), portal should pass it in via the plugin definition factory options.

### 3) Avoid duplicating “header tab injection” logic across plugins

If multiple plugins need the same admin archive/settings header pattern, extract a shared helper in the portal (or promote to a shared package if needed).

---

## Known non-standard / experimental code

There is an unrelated “PluginRegistry” implementation under `apps/portal/src/lib/plugins/*` (e.g. `registry.ts`, `PluginManager`, `Slot`) that is not wired into `PluginDefinition` or `packages/launchthat-plugin-*`.

We are treating this as **experimental** and will relocate it under an `experimental/` namespace or remove it once we confirm it’s unused.


