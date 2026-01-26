export default function AdminConnectionsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/40 bg-card/50 p-6">
        <div className="text-lg font-semibold text-foreground/90">Connections</div>
        <div className="mt-1 text-sm text-foreground/60">
          - On the root host: broker connections (TradeLocker, MT4/MT5, etc.) for your personal
          journal.
          <br />
          - On an org subdomain: org connections (Discord, Telegram, etc.) for your community.
        </div>
      </div>
    </div>
  );
}

