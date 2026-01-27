## TraderLaunchpad access model manual checklist

### Platform entitlements (platform admin)
- As platform admin, open `/platform/user/:clerkId/general`
  - Toggle **Entitlements** (Journal/Trade ideas/Analytics/Orders) and set **Max organizations**
  - Verify the user can/can’t access `/admin/journal`, `/admin/tradeideas`, `/admin/analytics`, `/admin/orders` accordingly
  - Verify org creation enforces `maxOrganizations` (see `convex/coreTenant/organizations.ts`)

### Public visibility (user self-service)
- As a normal user, open `/admin/settings/visibility`
  - Set `Public profile` ON → verify `/u/:username` renders profile
  - Set `Trade ideas (list)` ON and `Trade ideas (detail)` OFF
    - Verify `/u/:username/tradeideas` shows list
    - Verify `/u/:username/tradeidea/:id` returns empty/not found unless share code is provided
  - Set both ON → verify detail pages render

### Anonymous behavior
- In an incognito window:
  - Verify public pages respect the visibility toggles

### Feature flag sanity
- Create a flag row via `convex/flags.upsert` (admin-only)
  - Verify `convex/flags.isEnabledForUser` reflects allow/deny and percentage rollouts

