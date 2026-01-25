export default function AdminConnectionsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-6">
        <div className="text-lg font-semibold text-white/90">Connections</div>
        <div className="mt-1 text-sm text-white/60">
          - On the root host: broker connections (TradeLocker, MT4/MT5, etc.) for your personal
          journal.
          <br />
          - On an org subdomain: org connections (Discord, Telegram, etc.) for your community.
        </div>
      </div>
    </div>
  );
}

