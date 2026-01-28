import * as React from "react";

// TraderLaunchpad now uses `@acme/ui/layout/StandardLayout` from the root `app/layout.tsx`.
// This file stays as a thin route-group wrapper.
export default function AdminLayout(props: { children: React.ReactNode }) {
  return <div className="py-6 container">{props.children}</div>;
}
