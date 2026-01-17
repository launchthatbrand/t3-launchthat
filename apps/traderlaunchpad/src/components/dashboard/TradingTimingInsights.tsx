"use client";

import React from "react";

import { cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

interface HourStat {
  hour: string;
  pnl: number;
}

interface DayStat {
  day: string;
  pnl: number;
}

const HOURLY_PNL: HourStat[] = [
  { hour: "02:00", pnl: -40 },
  { hour: "06:00", pnl: 120 },
  { hour: "09:00", pnl: 320 },
  { hour: "11:00", pnl: 210 },
  { hour: "14:00", pnl: -90 },
  { hour: "16:00", pnl: 180 },
  { hour: "20:00", pnl: -60 },
];

const DAY_PNL: DayStat[] = [
  { day: "Mon", pnl: 260 },
  { day: "Tue", pnl: -120 },
  { day: "Wed", pnl: 340 },
  { day: "Thu", pnl: 180 },
  { day: "Fri", pnl: -40 },
];

const maxAbs = (values: number[]) =>
  Math.max(1, ...values.map((value) => Math.abs(value)));

export function TradingTimingInsights() {
  const hourMax = maxAbs(HOURLY_PNL.map((item) => item.pnl));
  const dayMax = maxAbs(DAY_PNL.map((item) => item.pnl));

  return (
    <Card className="border-white/10 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Trading Timing Insights</CardTitle>
          <Badge variant="outline">Mock</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="text-muted-foreground text-xs tracking-wide uppercase">
            Best hours (PnL)
          </div>
          <div className="mt-3 space-y-2">
            {HOURLY_PNL.map((item) => (
              <div key={item.hour} className="flex items-center gap-3 text-xs">
                <div className="text-muted-foreground w-10">{item.hour}</div>
                <div className="bg-muted/40 relative h-2 flex-1 rounded-full">
                  <div
                    className={cn(
                      "absolute top-0 left-1/2 h-2 rounded-full",
                      item.pnl >= 0 ? "bg-orange-500/80" : "bg-red-500/80",
                    )}
                    style={{
                      width: `${(Math.abs(item.pnl) / hourMax) * 50}%`,
                      transform:
                        item.pnl >= 0 ? "translateX(0)" : "translateX(-100%)",
                    }}
                  />
                </div>
                <div
                  className={cn(
                    "w-12 text-right font-semibold",
                    item.pnl >= 0 ? "text-orange-300" : "text-red-400",
                  )}
                >
                  {item.pnl >= 0 ? "+" : ""}
                  {item.pnl}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground text-xs tracking-wide uppercase">
            Best days (PnL)
          </div>
          <div className="mt-3 space-y-2">
            {DAY_PNL.map((item) => (
              <div key={item.day} className="flex items-center gap-3 text-xs">
                <div className="text-muted-foreground w-10">{item.day}</div>
                <div className="bg-muted/40 relative h-2 flex-1 rounded-full">
                  <div
                    className={cn(
                      "absolute top-0 left-1/2 h-2 rounded-full",
                      item.pnl >= 0 ? "bg-orange-500/80" : "bg-red-500/80",
                    )}
                    style={{
                      width: `${(Math.abs(item.pnl) / dayMax) * 50}%`,
                      transform:
                        item.pnl >= 0 ? "translateX(0)" : "translateX(-100%)",
                    }}
                  />
                </div>
                <div
                  className={cn(
                    "w-12 text-right font-semibold",
                    item.pnl >= 0 ? "text-orange-300" : "text-red-400",
                  )}
                >
                  {item.pnl >= 0 ? "+" : ""}
                  {item.pnl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
