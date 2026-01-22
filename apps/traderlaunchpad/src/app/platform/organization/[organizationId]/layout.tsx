import * as React from "react";

import Link from "next/link";

export default function PlatformOrganizationLayout(props: {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}) {
  // Note: Next provides params synchronously, but some tooling types it as Promise in server layouts.
  // Keep this layout server-safe and derive hrefs from the segment when possible.
  // We render the tab nav in each child page (client) for now.
  return <>{props.children}</>;
}

