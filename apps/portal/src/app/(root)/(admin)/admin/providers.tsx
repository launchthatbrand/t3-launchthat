"use client";

import type { ReactNode } from "react";

import { AdminPostProvider } from "./_providers/AdminPostProvider";

function Providers({ children }: { children: ReactNode }) {
  return <AdminPostProvider>{children}</AdminPostProvider>;
}

export default Providers;
