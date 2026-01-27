export default function PlatformConnectionsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/40 bg-card/50 p-6">
        <div className="text-lg font-semibold text-foreground/90">Connections</div>
        <div className="mt-1 text-sm text-foreground/60">
          Platform connections use the same TradeLocker broker connection flow as{" "}
          <span className="font-mono">/admin/connections</span>.
        </div>
      </div>
    </div>
  );
}

