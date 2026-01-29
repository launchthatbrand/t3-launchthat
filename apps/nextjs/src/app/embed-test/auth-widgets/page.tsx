"use client";

import * as React from "react";

type WidgetKind = "profileCard" | "myTrades" | "openPositions";

const widgetTag = (kind: WidgetKind) => {
  if (kind === "myTrades") return "tdrlp-my-trades";
  if (kind === "openPositions") return "tdrlp-open-positions";
  return "tdrlp-profile-card";
};

export default function EmbedTestAuthedWidgetsPage() {
  const [kind, setKind] = React.useState<WidgetKind>("profileCard");
  const [installationId, setInstallationId] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");

  React.useEffect(() => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = "http://localhost:3000/widgets/tdrlp-widgets.es.js?v=dev";
    document.head.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);

  const elementTag = widgetTag(kind);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>Embed test — authenticated widgets</h1>
      <p style={{ marginTop: 6, fontSize: 13, color: "#475569" }}>
        Paste an <code>installationId</code> + <code>apiKey</code> generated from{" "}
        <code>http://localhost:3000/admin/settings/widgets</code>.
      </p>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr", marginTop: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, color: "#475569" }}>Widget</div>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as WidgetKind)}
            style={{ height: 38, borderRadius: 10, border: "1px solid #e2e8f0", padding: "0 10px" }}
          >
            <option value="profileCard">Profile card</option>
            <option value="myTrades">My trades</option>
            <option value="openPositions">Open positions</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, color: "#475569" }}>Installation ID</div>
          <input
            value={installationId}
            onChange={(e) => setInstallationId(e.target.value)}
            placeholder="jd..."
            style={{ height: 38, borderRadius: 10, border: "1px solid #e2e8f0", padding: "0 10px" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, color: "#475569" }}>API key</div>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="wkey_..."
            style={{ height: 38, borderRadius: 10, border: "1px solid #e2e8f0", padding: "0 10px" }}
          />
        </label>
      </div>

      <div style={{ marginTop: 18, padding: 14, borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff" }}>
        {/* Render chosen element (JSX can't use dynamic tag), so branch by kind */}
        {elementTag === "tdrlp-profile-card" ? (
          // @ts-expect-error - custom element
          <tdrlp-profile-card
            api-base="https://different-trout-684.convex.site"
            installation-id={installationId}
            api-key={apiKey}
            style={{
              ["--tdrlp-bg" as any]: "#ffffff",
              ["--tdrlp-fg" as any]: "#0f172a",
              ["--tdrlp-muted" as any]: "#475569",
              ["--tdrlp-border" as any]: "#e2e8f0",
              ["--tdrlp-accent" as any]: "#2563eb",
              ["--tdrlp-radius" as any]: "12px",
              ["--tdrlp-font" as any]: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
            }}
          />
        ) : elementTag === "tdrlp-my-trades" ? (
          // @ts-expect-error - custom element
          <tdrlp-my-trades
            api-base="https://different-trout-684.convex.site"
            installation-id={installationId}
            api-key={apiKey}
            style={{
              ["--tdrlp-bg" as any]: "#ffffff",
              ["--tdrlp-fg" as any]: "#0f172a",
              ["--tdrlp-muted" as any]: "#475569",
              ["--tdrlp-border" as any]: "#e2e8f0",
              ["--tdrlp-accent" as any]: "#2563eb",
              ["--tdrlp-radius" as any]: "12px",
              ["--tdrlp-font" as any]: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
            }}
          />
        ) : (
          // @ts-expect-error - custom element
          <tdrlp-open-positions
            api-base="https://different-trout-684.convex.site"
            installation-id={installationId}
            api-key={apiKey}
            style={{
              ["--tdrlp-bg" as any]: "#ffffff",
              ["--tdrlp-fg" as any]: "#0f172a",
              ["--tdrlp-muted" as any]: "#475569",
              ["--tdrlp-border" as any]: "#e2e8f0",
              ["--tdrlp-accent" as any]: "#2563eb",
              ["--tdrlp-radius" as any]: "12px",
              ["--tdrlp-font" as any]: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
            }}
          />
        )}
      </div>
    </div>
  );
}

