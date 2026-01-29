"use client";

import "tdrlp-widgets";

import * as React from "react";

import { useTdrLpWidgetTheme } from "~/components/widgets/useTdrLpWidgetTheme";

export default function EconomicCalendarWidgetPreviewPage() {
  const { newsBase, widgetStyle } = useTdrLpWidgetTheme();

  return (
    <div className="p-3">
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

