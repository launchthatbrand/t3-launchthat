"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Badge } from "@acme/ui/badge";
import { cn } from "@acme/ui";
import {
  TradingChartMock,
  type TradingChartMarker,
  type TradingTimeframe,
} from "./TradingChartMock";

type Props = {
  title: string;
  symbol: string;
  markers?: TradingChartMarker[];
  height?: number;
  defaultTimeframe?: TradingTimeframe;
  timeframes?: TradingTimeframe[];
  className?: string;
};

export function TradingChartCard(props: Props) {
  const timeframes = props.timeframes ?? ["15m", "1h", "4h"];
  const [timeframe, setTimeframe] = React.useState<TradingTimeframe>(
    props.defaultTimeframe ?? timeframes[0] ?? "15m",
  );

  React.useEffect(() => {
    // If caller changes defaults/options, keep selection valid.
    if (timeframes.includes(timeframe)) return;
    setTimeframe(props.defaultTimeframe ?? timeframes[0] ?? "15m");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.defaultTimeframe, timeframes.join("|")]);

  return (
    <Card
      className={cn(
        "overflow-hidden border-white/10 bg-white/3 backdrop-blur-md",
        props.className,
      )}
    >
      <CardHeader className="border-b bg-muted/10 border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{props.title}</CardTitle>

          <div className="flex items-center gap-2">
            {timeframes.map((tf) => {
              const isActive = tf === timeframe;
              return (
                <Badge
                  key={tf}
                  asChild
                  variant="outline"
                  className={cn(
                    "border-white/10 bg-background/20 transition-colors",
                    isActive
                      ? "bg-white/10 text-white"
                      : "cursor-pointer text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <button type="button" onClick={() => setTimeframe(tf)}>
                    {tf}
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="bg-black/40 p-0">
        <TradingChartMock
          symbol={props.symbol}
          height={props.height ?? 400}
          timeframe={timeframe}
          showDefaultMarkers={false}
          markers={props.markers}
        />
      </CardContent>
    </Card>
  );
}

