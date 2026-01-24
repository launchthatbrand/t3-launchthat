"use client";

import React from "react";

import { useTenant } from "~/context/TenantContext";

import { ConnectionsShell } from "./ConnectionsShell";
import { OrgConnectionsShell } from "./OrgConnectionsShell";

export default function AdminSettingsConnectionsLayout(props: {
  children: React.ReactNode;
}) {
  const tenant = useTenant();
  const isOrgMode = Boolean(tenant && tenant.slug !== "platform");

  return isOrgMode ? (
    <OrgConnectionsShell>{props.children}</OrgConnectionsShell>
  ) : (
    <ConnectionsShell>{props.children}</ConnectionsShell>
  );
}

