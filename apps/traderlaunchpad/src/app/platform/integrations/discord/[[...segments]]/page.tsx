"use client";

import React from "react";
import { PlatformDiscordAdminClient } from "./DiscordAdminClient";

export default function PlatformIntegrationsDiscordPage() {
  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Discord</h1>
        <div className="text-muted-foreground text-sm">
          Manage the TraderLaunchpad platform Discord server.
        </div>
      </div>
      <PlatformDiscordAdminClient />
    </div>
  );
}
