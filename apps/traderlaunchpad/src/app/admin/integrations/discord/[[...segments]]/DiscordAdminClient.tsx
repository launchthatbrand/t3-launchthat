"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { DiscordAdminRouter } from "launchthat-plugin-discord/frontend/discord";

interface DiscordAdminClientProps {
  organizationId?: string;
}

export function DiscordAdminClient({
  organizationId,
}: DiscordAdminClientProps) {
  const params = useParams<{ segments?: string | string[] }>();
  const rawSegments = params.segments;
  const segments = Array.isArray(rawSegments)
    ? rawSegments
    : rawSegments
      ? [rawSegments]
      : [];

  return (
    <DiscordAdminRouter
      segments={segments}
      organizationId={organizationId}
      basePath="/admin/integrations/discord"
      LinkComponent={Link}
      api={{
        queries: api.discord.queries,
        mutations: api.discord.mutations,
        actions: api.discord.actions,
      }}
    />
  );
}
