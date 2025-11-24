import type { ReactNode } from "react";

export function HeroStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
      <div className="flex items-center gap-3 text-primary">
        <span className="rounded-full bg-primary/10 p-2">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}
