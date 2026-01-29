"use client";

import "tdrlp-widgets";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { EconomicCalendarEmbedMeDialog } from "~/components/widgets/EconomicCalendarEmbedMeDialog";
import { useTdrLpWidgetTheme } from "~/components/widgets/useTdrLpWidgetTheme";

export default function WidgetsShowcasePage() {
  const { newsBase, widgetStyle } = useTdrLpWidgetTheme();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6">
        <div className="text-2xl font-semibold tracking-tight">Widgets</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Public widget showcase + embed configuration.{" "}
          <Link href="/news/forex/calendar" className="underline underline-offset-4 hover:text-foreground">
            View the calendar page
          </Link>
          .
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">Forex economic calendar</CardTitle>
            <div className="text-xs text-muted-foreground">
              Desktop + mobile previews, plus an embed code generator.
            </div>
          </div>
          <EconomicCalendarEmbedMeDialog newsBase={newsBase} widgetStyle={widgetStyle} />
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Desktop preview</div>
            <div className="rounded-lg border border-border/50 p-3">
              {/* @ts-expect-error - custom element */}
              <tdrlp-economic-calendar
                api-base="https://different-trout-684.convex.site"
                news-base={newsBase}
                preset="thisWeek"
                style={widgetStyle}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Mobile preview</div>
            <div className="flex justify-center">
              <div className="w-[390px] overflow-hidden rounded-[22px] border border-border/60 bg-background shadow-sm">
                <div className="h-[740px] w-full">
                  <iframe
                    title="Economic calendar mobile preview"
                    src="/widgets/preview/economic-calendar"
                    className="h-full w-full"
                  />
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Mobile preview is rendered in an iframe so the widget switches to its mobile layout.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

