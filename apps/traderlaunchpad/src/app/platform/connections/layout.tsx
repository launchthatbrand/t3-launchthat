import React from "react";
import { ConnectionsShell } from "../../admin/settings/connections/ConnectionsShell";

export default function PlatformConnectionsLayout(props: { children: React.ReactNode }) {
  return <ConnectionsShell>{props.children}</ConnectionsShell>;
}

