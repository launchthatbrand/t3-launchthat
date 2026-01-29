"use client"

import * as React from "react";
export default function EmbeddedEconomicCalendar() {
  React.useEffect(() => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = "http://localhost:3000/widgets/tdrlp-widgets.es.js?v=dev";
    document.head.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);
  return (
    // @ts-expect-error - custom element
    <tdrlp-economic-calendar
      api-base="https://different-trout-684.convex.site"
      news-base="http://localhost:3000"
      preset="thisWeek"
      style={{
        ["--tdrlp-bg" as any]: "#ffffff",
        ["--tdrlp-fg" as any]: "#0f172a",
        ["--tdrlp-muted" as any]: "#475569",
        ["--tdrlp-border" as any]: "#e2e8f0",
        ["--tdrlp-accent" as any]: "#2563eb",
        ["--tdrlp-radius" as any]: ".625rem",
        ["--tdrlp-font" as any]: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      }}
    />
  );
}