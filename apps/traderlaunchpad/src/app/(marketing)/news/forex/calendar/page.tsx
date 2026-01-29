"use client";

import "tdrlp-widgets";

import * as React from "react";

import Link from "next/link";

import { EconomicCalendarEmbedMeDialog } from "~/components/widgets/EconomicCalendarEmbedMeDialog";
import { useTdrLpWidgetTheme } from "~/components/widgets/useTdrLpWidgetTheme";

export default function ForexEconomicCalendarPage() {
  const { newsBase, widgetStyle } = useTdrLpWidgetTheme();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6">
        <div className="text-2xl font-semibold tracking-tight">Forex economic calendar</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Economic events ingested into TraderLaunchpad.{" "}
          <Link href="/news" className="underline underline-offset-4 hover:text-foreground">
            View news feed
          </Link>
          .
        </div>
      </div>

      <div className="mb-3 flex items-center justify-end">
        <EconomicCalendarEmbedMeDialog newsBase={newsBase} widgetStyle={widgetStyle} />
      </div>

      {/* @ts-expect-error - custom element */}
      <tdrlp-economic-calendar
        api-base="https://different-trout-684.convex.site"
        news-base={newsBase}
        preset="thisWeek"
        style={widgetStyle}
      />
    </div>
  );
}

