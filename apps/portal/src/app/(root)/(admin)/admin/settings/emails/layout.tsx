import type { ReactNode } from "react";
import React from "react";

export default function EmailsLayout({ children }: { children: ReactNode }) {
  // Settings routes are wrapped by `admin/settings/layout.tsx` (AdminLayout).
  return <div className="container space-y-6 py-6">{children}</div>;
}
