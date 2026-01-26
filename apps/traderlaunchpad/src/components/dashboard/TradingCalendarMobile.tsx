"use client";

import React from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Smile } from "lucide-react";

import { cn } from "@acme/ui";

import type { TradingCalendarDailyStat } from "./TradingCalendarPanel";
import {
  getTradingCalendarRecommendations,
  toDateKey,
  weekdayLabel,
} from "./tradingCalendarRecommendations";

const formatPnl = (value: number): string =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const buildMonthDays = (monthOffset: number) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + monthOffset;
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startDay = firstOfMonth.getDay();
  const totalDays = lastOfMonth.getDate();

  const days: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < startDay; i += 1) {
    const date = new Date(year, month, -startDay + i + 1);
    days.push({ date, inMonth: false });
  }
  for (let day = 1; day <= totalDays; day += 1) {
    days.push({ date: new Date(year, month, day), inMonth: true });
  }
  while (days.length < 42) {
    const date = new Date(
      year,
      month,
      totalDays + (days.length - (startDay + totalDays)) + 1,
    );
    days.push({ date, inMonth: false });
  }

  const label = firstOfMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return { days, label };
};

export interface TradingCalendarMobileProps {
  dailyStats: TradingCalendarDailyStat[];
  selectedDate: string | null;
  onSelectDateAction: (value: string | null) => void;
  className?: string;
}

export const TradingCalendarMobile = ({
  dailyStats,
  selectedDate,
  onSelectDateAction,
  className,
}: TradingCalendarMobileProps) => {
  const [monthOffset, setMonthOffset] = React.useState(0);
  const { days, label } = buildMonthDays(monthOffset);
  const rec = React.useMemo(
    () => getTradingCalendarRecommendations({ dailyStats }),
    [dailyStats],
  );

  const dailyMap = React.useMemo(() => {
    const map: Record<string, TradingCalendarDailyStat> = {};
    for (const stat of dailyStats) {
      map[stat.date] = stat;
    }
    return map;
  }, [dailyStats]);

  const selected = selectedDate ? dailyMap[selectedDate] : undefined;

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/40 bg-card/70 p-4 backdrop-blur-md",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">
            Trading calendar
          </div>
          <div className="text-base font-semibold text-foreground">{label}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {rec.goodWeekdays.length > 0 ? (
              <div className="flex items-center gap-1.5">
                <Smile className="h-3.5 w-3.5 text-orange-300" />
                <span className="font-medium">Strong:</span>
                <span className="font-semibold text-foreground/80">
                  {rec.goodWeekdays.map(weekdayLabel).join(", ")}
                </span>
              </div>
            ) : null}
            {rec.badWeekdays.length > 0 ? (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-300" />
                <span className="font-medium">Weak:</span>
                <span className="font-semibold text-foreground/80">
                  {rec.badWeekdays.map(weekdayLabel).join(", ")}
                </span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthOffset((v) => v - 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-background/60 text-foreground/80 transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset((v) => v + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-background/60 text-foreground/80 transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0 text-[10px]">
        {["S", "M", "Tu", "W", "Th", "F", "S"].map((d, idx) => (
          <div
            key={`${d}-${idx}`}
            className="text-center font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="mt-2 overflow-hidden rounded-2xl border border-border/40">
        <div className="grid grid-cols-7 gap-0">
        {days.map(({ date, inMonth }) => {
          const key = toDateKey(date);
          const stat = dailyMap[key];
          const isSelected = selectedDate === key;
          const pnl = stat?.pnl ?? 0;
          const hasTrades = Boolean(stat);
          const isFuture = date.getTime() >= new Date().setHours(0, 0, 0, 0);
          const isGood = isFuture && rec.goodDateKeys.has(key);
          const isBad = isFuture && rec.badDateKeys.has(key);

          const indicatorClassName = hasTrades
            ? pnl >= 0
              ? "bg-orange-400/80"
              : "bg-red-400/80"
            : "bg-white/10";

          const hasUnrealized =
            typeof stat?.unrealizedPnl === "number" &&
            Number.isFinite(stat.unrealizedPnl) &&
            stat.unrealizedPnl !== 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDateAction(isSelected ? null : key)}
              className={cn(
                // Tight grid: no gaps, no rounded day cells (native calendar feel).
                "relative aspect-square rounded-none border border-border/40 bg-background/40 p-1 text-left transition-colors hover:bg-foreground/3 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden",
                // Collapse borders between cells.
                "-ml-px -mt-px",
                !inMonth && "opacity-50",
                isSelected && "z-10 border-orange-500/50 bg-orange-500/10",
                isGood &&
                  !isSelected &&
                  "border-orange-400/35 bg-linear-to-b from-orange-500/10 to-transparent",
                isBad &&
                  !isSelected &&
                  "border-red-400/30 bg-linear-to-b from-red-500/10 to-transparent",
              )}
              aria-label={`Select ${key}`}
            >
              <div
                className={cn(
                  "text-[11px] font-medium text-foreground/80",
                  !inMonth && "text-muted-foreground",
                )}
              >
                {date.getDate()}
              </div>
              {isGood ? (
                <Smile className="absolute top-1 right-1 h-3.5 w-3.5 text-orange-300" />
              ) : isBad ? (
                <AlertTriangle className="absolute top-1 right-1 h-3.5 w-3.5 text-red-300" />
              ) : null}
              {hasUnrealized ? (
                <div
                  className={cn(
                    "absolute right-1 bottom-[9px] left-1 h-0.5 rounded-full",
                    stat!.unrealizedPnl! >= 0 ? "bg-emerald-400/70" : "bg-rose-400/70",
                  )}
                />
              ) : null}
              <div
                className={cn(
                  "absolute right-1 bottom-1 left-1 h-1 rounded-full",
                  indicatorClassName,
                )}
              />
            </button>
          );
        })}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/40 bg-background/40 p-3">
        {selectedDate ? (
          selected ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Selected
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {selectedDate}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {selected.wins}W / {selected.losses}L
                </div>
              </div>
              <div
                className={cn(
                  "rounded-2xl border px-3 py-2 text-right",
                  selected.pnl >= 0
                    ? "border-orange-500/20 bg-orange-500/10"
                    : "border-red-500/20 bg-red-500/10",
                )}
              >
                <div className="text-[10px] font-medium text-muted-foreground">PnL</div>
                <div
                  className={cn(
                    "text-sm font-semibold",
                    selected.pnl >= 0 ? "text-orange-300" : "text-red-400",
                  )}
                >
                  {selected.pnl >= 0 ? "+" : ""}
                  {formatPnl(selected.pnl)}
                </div>
                {typeof selected.unrealizedPnl === "number" &&
                Number.isFinite(selected.unrealizedPnl) &&
                selected.unrealizedPnl !== 0 ? (
                  <div
                    className={cn(
                      "mt-1 text-[10px] font-medium tabular-nums",
                      selected.unrealizedPnl >= 0
                        ? "text-emerald-200"
                        : "text-rose-200",
                    )}
                  >
                    Unrealized {selected.unrealizedPnl >= 0 ? "+" : ""}
                    {formatPnl(selected.unrealizedPnl)}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-sm text-white/70">
              No trades on {selectedDate}.
            </div>
          )
        ) : (
          <div className="text-sm text-white/70">
            Tap a day to view your trades and daily stats.
          </div>
        )}
      </div>
    </div>
  );
};
