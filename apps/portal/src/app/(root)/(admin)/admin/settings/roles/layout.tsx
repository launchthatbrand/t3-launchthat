import type { ReactNode } from "react";

export default function RolesLayout({ children }: { children: ReactNode }) {
  // Settings routes are wrapped by `admin/settings/layout.tsx` (AdminLayout + tabs).
  return <div className="container py-6">{children}</div>;
}
