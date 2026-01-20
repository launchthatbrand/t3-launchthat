import { ConnectionsShell } from "./ConnectionsShell";

export default function AdminSettingsConnectionsLayout(props: {
  children: React.ReactNode;
}) {
  return <ConnectionsShell>{props.children}</ConnectionsShell>;
}

