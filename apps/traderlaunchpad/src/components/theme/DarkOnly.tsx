"use client";

import * as React from "react";
import { useTheme } from "@acme/ui/theme";

export function DarkOnly({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (resolvedTheme !== "dark") return null;
  return <>{children}</>;
}

