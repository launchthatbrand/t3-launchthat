# Discord UI embedding

Example Next.js mount at `/admin/discord/[[...segments]]`:

```tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { DiscordAdminRouter } from "launchthat-plugin-discord/frontend/discord";

export default function DiscordAdminPage() {
  const params = useParams<{ segments?: string[] }>();
  const segments = params?.segments ?? [];

  return (
    <DiscordAdminRouter
      segments={segments}
      organizationId="org_123"
      basePath="/admin/discord"
      api={{
        queries: api.plugins.discord.queries,
        mutations: api.plugins.discord.mutations,
        actions: api.plugins.discord.actions,
      }}
    />
  );
}
```
