"use client";

import React from "react";
import { AdminSettingsOrgDiscordAdminClient } from "../../settings/connections/discord/[[...segments]]/DiscordAdminClient";

export default function AdminConnectionsDiscordPage() {
  return (
    <div className="space-y-6">
      <AdminSettingsOrgDiscordAdminClient />
    </div>
  );
}

