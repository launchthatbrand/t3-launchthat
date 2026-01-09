"use client";

import React, { useMemo } from "react";

import { GridPattern } from "@acme/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

const buildRandomSquares = (count: number): number[][] => {
  const seen = new Set<string>();
  const squares: number[][] = [];
  while (squares.length < count) {
    const x = Math.floor(Math.random() * 4) + 7;
    const y = Math.floor(Math.random() * 6) + 1;
    const key = `${x}-${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    squares.push([x, y]);
  }
  return squares;
};

export const DashboardMetricCard = ({
  title,
  value,
  subtitle,
  pattern,
}: {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  pattern?: number[][];
}) => {
  // Match the "FeaturesSection" vibe: randomized squares, but stable for the component's lifetime.
  const squares = useMemo(() => {
    if (Array.isArray(pattern) && pattern.length > 0) return pattern;
    return buildRandomSquares(5);
  }, [pattern]);

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 mask-[radial-gradient(farthest-side_at_top,white,transparent)] opacity-100">
          <GridPattern
            width={22}
            height={22}
            x="-12"
            y="4"
            squares={squares}
            className="fill-foreground/5 stroke-foreground/10 absolute inset-0 h-full w-full"
          />
        </div>
      </div>

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 space-y-1">
        <div className="text-2xl font-semibold">{value}</div>
        {subtitle ? (
          <div className="text-muted-foreground text-sm">{subtitle}</div>
        ) : null}
      </CardContent>
    </Card>
  );
};
