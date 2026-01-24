"use client";

import React from "react";

export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  // TEMP: disable route transition animation for perf debugging.
  return <>{children}</>;
}
