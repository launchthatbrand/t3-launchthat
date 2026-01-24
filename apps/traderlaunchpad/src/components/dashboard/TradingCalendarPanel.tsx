"use client";

import React from "react";
import { AlertTriangle, Smile } from "lucide-react";

import { cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import {
  getTradingCalendarRecommendations,
  toDateKey,
  weekdayLabel,
} from "./tradingCalendarRecommendations";

interface DailyStat {
  date: string;
  pnl: number;
  wins: number;
  losses: number;
  unrealizedPnl?: number;
}

export type TradingCalendarDailyStat = DailyStat;

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

  const label = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return { days, label, monthStart: firstOfMonth };
};

export function TradingCalendarPanel({
  dailyStats,
  selectedDate,
  onSelectDateAction,
  className,
  contentClassName,
}: {
  dailyStats: TradingCalendarDailyStat[];
  selectedDate: string | null;
  onSelectDateAction: (value: string | null) => void;
  className?: string;
  contentClassName?: string;
}) {
  const [monthOffset, setMonthOffset] = React.useState(0);
  const { days, label, monthStart } = buildMonthDays(monthOffset);
  const rec = React.useMemo(
    () =>
      getTradingCalendarRecommendations({
        dailyStats,
        minSamplesWeekday: 1,
        minSamplesDayOfMonth: 1,
      }),
    [dailyStats],
  );

  // Keep the displayed month in sync with the currently selected date (used as a page-wide filter).
  React.useEffect(() => {
    if (!selectedDate) return;
    const parsed = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return;

    const today = new Date();
    const diffMonths =
      (parsed.getFullYear() - today.getFullYear()) * 12 +
      (parsed.getMonth() - today.getMonth());
    setMonthOffset(diffMonths);
    // Important: do NOT depend on the currently displayed month here.
    // If we re-run this effect when the user clicks Prev/Next (monthOffset changes),
    // it will snap back to the selected month and make month navigation feel broken.
  }, [selectedDate]);

  const dailyMap = React.useMemo(() => {
    const map: Record<string, DailyStat> = {};
    for (const stat of dailyStats) {
      map[stat.date] = stat;
    }
    return map;
  }, [dailyStats]);

  return (
    <Card
      className={cn(
        "border-white/10 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6",
        className,
      )}
    >
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Trading Calendar</CardTitle>
          <p className="text-muted-foreground text-sm">
            Daily win/loss totals with quick drill-down.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
            {rec.goodWeekdays.length > 0 ? (
              <div className="flex items-center gap-1.5">
                <Smile className="h-3.5 w-3.5 text-orange-300" />
                <span className="font-medium">Projected strong:</span>
                <span className="font-semibold text-white/80">
                  {rec.goodWeekdays.map(weekdayLabel).join(", ")}
                </span>
              </div>
            ) : null}
            {rec.badWeekdays.length > 0 ? (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-300" />
                <span className="font-medium">Projected weak:</span>
                <span className="font-semibold text-white/80">
                  {rec.badWeekdays.map(weekdayLabel).join(", ")}
                </span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={() => setMonthOffset((prev) => prev - 1)}
          >
            Prev
          </Button>
          <Badge variant="outline" className="border-white/15 text-white/80">
            {label}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={() => setMonthOffset((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </CardHeader>
      <CardContent
        className={contentClassName}
        onClick={() => onSelectDateAction(null)}
      >
        <div className="grid grid-cols-7 gap-0 sm:gap-2 text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-white/60">
              {day}
            </div>
          ))}
          {/* Tight mobile grid: no gaps, no rounded day cells */}
          {days.map(({ date, inMonth }) => {
            const key = toDateKey(date);
            const stat = dailyMap[key];
            const isSelected = selectedDate === key;
            const pnl = stat?.pnl ?? 0;
            const hasTrades = Boolean(stat);
            const isFuture = date.getTime() >= new Date().setHours(0, 0, 0, 0);
            const isGood = isFuture && rec.goodDateKeys.has(key);
            const isBad = isFuture && rec.badDateKeys.has(key);

            return (
              <button
                key={key}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectDateAction(key);
                }}
                className={cn(
                  "flex flex-col gap-1 border border-white/10 bg-black/20 p-1 text-left transition hover:border-orange-500/60 hover:bg-white/5 sm:rounded-md sm:p-2",
                  // Collapse borders on mobile so it feels like one continuous grid.
                  "rounded-none -ml-px -mt-px sm:ml-0 sm:mt-0",
                  !inMonth && "bg-black/10 text-white/30",
                  isSelected && "z-10 border-orange-500 bg-orange-500/10",
                  isGood &&
                    !isSelected &&
                    "border-orange-400/40 bg-linear-to-b from-orange-500/10 to-transparent shadow-[0_0_0_1px_rgba(249,115,22,0.15)]",
                  isBad &&
                    !isSelected &&
                    "border-red-400/35 bg-linear-to-b from-red-500/10 to-transparent shadow-[0_0_0_1px_rgba(248,113,113,0.12)]",
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={cn(!inMonth && "opacity-40")}>
                    {date.getDate()}
                  </span>
                  {isGood ? (
                    <Smile className="h-3.5 w-3.5 text-orange-300" />
                  ) : isBad ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-300" />
                  ) : null}
                </div>
                {hasTrades ? (
                  <div className="mt-1 space-y-1">
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        pnl >= 0 ? "text-orange-300" : "text-red-400",
                      )}
                    >
                      {pnl >= 0 ? "+" : ""}
                      {formatPnl(pnl)}
                    </div>
                    {typeof stat?.unrealizedPnl === "number" &&
                    Number.isFinite(stat.unrealizedPnl) &&
                    stat.unrealizedPnl !== 0 ? (
                      <div
                        className={cn(
                          "text-[10px] font-medium tabular-nums",
                          stat.unrealizedPnl >= 0
                            ? "text-emerald-300"
                            : "text-rose-300",
                        )}
                      >
                        U {stat.unrealizedPnl >= 0 ? "+" : ""}
                        {formatPnl(stat.unrealizedPnl)}
                      </div>
                    ) : null}
                    <div className="text-[10px] text-white/60">
                      {stat?.wins ?? 0}W / {stat?.losses ?? 0}L
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-[10px] text-white/30">
                    <span className="sm:hidden">—</span>
                    <span className="hidden sm:inline">— No trades</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
