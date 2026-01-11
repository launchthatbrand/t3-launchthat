"use client";

import "~/lib/plugins/registerPermalinkResolvers.client";
import "~/lib/plugins/registerCoreAdminArchiveHooks.client";
import "~/lib/plugins/installHooks";

import type { ReactNode } from "react";

import { AdminPostProvider } from "./_providers/AdminPostProvider";

function Providers({ children }: { children: ReactNode }) {
  return <AdminPostProvider>{children}</AdminPostProvider>;
}

export default Providers;
