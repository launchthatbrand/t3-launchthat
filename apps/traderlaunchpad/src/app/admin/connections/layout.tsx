"use client";

import React from "react";

import { useTenant } from "~/context/TenantContext";

import { ConnectionsShell } from "../settings/connections/ConnectionsShell";
import { OrgConnectionsShell } from "../settings/connections/OrgConnectionsShell";

export default function AdminConnectionsLayout(props: { children: React.ReactNode }) {
  const tenant = useTenant();
  const isOrgMode = Boolean(tenant && tenant.slug !== "platform");

  return isOrgMode ? (
    <OrgConnectionsShell>{props.children}</OrgConnectionsShell>
  ) : (
    <ConnectionsShell>{props.children}</ConnectionsShell>
  );
}

