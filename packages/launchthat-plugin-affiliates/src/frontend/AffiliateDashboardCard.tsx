import type { ReactNode } from "react";

export type AffiliateStats = {
  clicks30d: number;
  signups30d: number;
  activations30d: number;
  conversions30d: number;
  creditBalanceCents: number;
};

export type AffiliateDashboardCardProps = {
  title?: string;
  stats: AffiliateStats;
  footer?: ReactNode;
  className?: string;
};

const formatUsd = (cents: number): string => {
  const v = Math.round(cents) / 100;
  return `$${v.toFixed(2)}`;
};

export const AffiliateDashboardCard = ({
  title,
  stats,
  footer,
  className,
}: AffiliateDashboardCardProps) => {
  return (
    <div className={className ?? "rounded-xl border bg-background p-4"}>
      {title ? (
        <div className="mb-3 text-sm font-semibold text-foreground">{title}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground">Clicks (30d)</div>
          <div className="mt-1 text-lg font-semibold">{stats.clicks30d}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground">Signups (30d)</div>
          <div className="mt-1 text-lg font-semibold">{stats.signups30d}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground">Activations (30d)</div>
          <div className="mt-1 text-lg font-semibold">{stats.activations30d}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground">Paid conversions (30d)</div>
          <div className="mt-1 text-lg font-semibold">{stats.conversions30d}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border bg-card p-3 text-sm">
        <div className="text-xs text-muted-foreground">Credit balance</div>
        <div className="font-semibold">{formatUsd(stats.creditBalanceCents)}</div>
      </div>

      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
};

