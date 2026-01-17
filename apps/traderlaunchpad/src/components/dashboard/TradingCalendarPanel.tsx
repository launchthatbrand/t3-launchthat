"use client";

import React from "react";

import { cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

interface DailyStat {
  date: string;
  pnl: number;
  wins: number;
  losses: number;
}

export type TradingCalendarDailyStat = DailyStat;

const toKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

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
  const { days, label } = buildMonthDays(monthOffset);

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
        <div className="grid grid-cols-7 gap-2 text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-white/60">
              {day}
            </div>
          ))}
          {days.map(({ date, inMonth }) => {
            const key = toKey(date);
            const stat = dailyMap[key];
            const isSelected = selectedDate === key;
            const pnl = stat?.pnl ?? 0;
            const hasTrades = Boolean(stat);

            return (
              <button
                key={key}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectDateAction(key);
                }}
                className={cn(
                  "flex flex-col gap-1 rounded-md border border-white/10 bg-black/20 p-2 text-left transition hover:border-orange-500/60 hover:bg-white/5",
                  !inMonth && "bg-black/10 text-white/30",
                  isSelected && "border-orange-500 bg-orange-500/10",
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={cn(!inMonth && "opacity-40")}>
                    {date.getDate()}
                  </span>
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
                      {pnl}
                    </div>
                    <div className="text-[10px] text-white/60">
                      {stat?.wins ?? 0}W / {stat?.losses ?? 0}L
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-[10px] text-white/30">
                    — No trades
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
