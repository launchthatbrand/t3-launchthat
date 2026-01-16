import React from "react";

import { DiscordAdminClient } from "./DiscordAdminClient";

type DiscordIntegrationsPageProps = {
  params?: {
    segments?: string[];
  };
};

export default function DiscordIntegrationsPage({
  params,
}: DiscordIntegrationsPageProps) {
  return <DiscordAdminClient segments={params?.segments ?? []} />;
}
