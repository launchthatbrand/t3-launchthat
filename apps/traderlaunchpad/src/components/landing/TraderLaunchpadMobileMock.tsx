"use client";

import React from "react";
import {
  BarChart3,
  Bell,
  Home,
  PieChart,
  Search,
  Settings,
} from "lucide-react";

import { demoCalendarDailyStats } from "@acme/demo-data";
import { cn } from "@acme/ui";

import type { TradingCalendarDailyStat } from "~/components/dashboard/TradingCalendarPanel";
import { TradingCalendarMobile } from "~/components/dashboard/TradingCalendarMobile";

export type TraderLaunchpadMobileTab =
  | "home"
  | "signals"
  | "journal"
  | "settings";

export type TraderLaunchpadMobileRoute =
  | { kind: "tab"; tab: TraderLaunchpadMobileTab }
  | { kind: "signalDetail"; signalId: string }
  | { kind: "insight"; insightId: "best-time" | "other" };

export const TraderLaunchpadMobileMock = ({
  route,
  onNavigateAction,
}: {
  route: TraderLaunchpadMobileRoute;
  onNavigateAction: (route: TraderLaunchpadMobileRoute) => void;
}) => {
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl bg-[#0b0b0f]">
      {/* Status bar spacer (we already render lockscreen header outside) */}
      {/* <div className="h-4" /> */}

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-orange-500/10 via-transparent to-black/20" />

        <div className="relative h-full overflow-auto px-4 pt-14 pb-24">
          <TopBar onNavigateAction={onNavigateAction} />
          <Screen
            route={route}
            onNavigateAction={onNavigateAction}
            selectedDate={selectedDate}
            onSelectDateAction={setSelectedDate}
          />
        </div>
      </div>

      <BottomNav route={route} onNavigateAction={onNavigateAction} />
    </div>
  );
};

const TopBar = ({
  onNavigateAction,
}: {
  onNavigateAction: (route: TraderLaunchpadMobileRoute) => void;
}) => {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <div className="text-xs font-medium text-white/60">TraderLaunchpad</div>
        <div className="text-lg font-semibold text-white">Dashboard</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigateAction({ kind: "tab", tab: "signals" })}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-md transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden"
          aria-label="Go to signals"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-md transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const Screen = ({
  route,
  onNavigateAction,
  selectedDate,
  onSelectDateAction,
}: {
  route: TraderLaunchpadMobileRoute;
  onNavigateAction: (route: TraderLaunchpadMobileRoute) => void;
  selectedDate: string | null;
  onSelectDateAction: (value: string | null) => void;
}) => {
  if (route.kind === "insight" && route.insightId === "best-time") {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="mb-2 text-xs font-medium text-white/60">
          Trading Insight
        </div>
        <div className="text-base font-semibold text-white">
          Best time to trade in ~10 minutes
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Based on your preferred session, current volatility regime, and the
          historical performance of your setup in similar conditions, the next
          high-probability window begins shortly.
        </p>
        <div className="mt-4 grid gap-2">
          <Metric label="Volatility" value="High (1.34σ)" />
          <Metric label="Trend alignment" value="Strong" />
          <Metric label="Avg. breakout time" value="9–12 min" />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onNavigateAction({ kind: "tab", tab: "signals" })}
            className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden"
          >
            View signals
          </button>
          <button
            type="button"
            onClick={() => onNavigateAction({ kind: "tab", tab: "home" })}
            className="rounded-full border border-white/15 bg-white/0 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (route.kind === "signalDetail") {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="mb-2 text-xs font-medium text-white/60">Signal</div>
        <div className="text-base font-semibold text-white">
          BTCUSDT momentum shift
        </div>
        <div className="mt-2 rounded-2xl border border-white/10 bg-black/40 p-3">
          <div className="text-xs font-medium text-white/70">Entry</div>
          <div className="mt-1 text-sm font-semibold text-white">
            Break + retest confirmation
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/70">
            <div className="rounded-xl bg-white/5 p-2">
              <div className="text-white/50">Risk</div>
              <div className="text-white">0.5%</div>
            </div>
            <div className="rounded-xl bg-white/5 p-2">
              <div className="text-white/50">RR</div>
              <div className="text-white">1 : 2.1</div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateAction({ kind: "tab", tab: "signals" })}
          className="mt-4 w-full rounded-full border border-white/15 bg-white/0 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden"
        >
          Back to signals
        </button>
      </div>
    );
  }

  const activeTab = route.kind === "tab" ? route.tab : "home";

  if (activeTab === "signals") {
    return (
      <div className="space-y-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white/60">
                Live Signals
              </div>
              <div className="text-base font-semibold text-white">
                Today’s top setups
              </div>
            </div>
            <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
              Live
            </div>
          </div>
        </div>

        {[
          {
            id: "btc",
            title: "BTCUSDT momentum shift",
            subtitle: "Break + retest confirmed",
            badge: "High confidence",
          },
          {
            id: "eur",
            title: "EURUSD mean reversion",
            subtitle: "Range edge + divergence",
            badge: "Watch",
          },
        ].map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() =>
              onNavigateAction({ kind: "signalDetail", signalId: s.id })
            }
            className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-md transition-colors hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">
                  {s.title}
                </div>
                <div className="mt-1 truncate text-xs text-white/60">
                  {s.subtitle}
                </div>
              </div>
              <div className="shrink-0 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-medium text-white/70">
                {s.badge}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (activeTab === "journal") {
    return (
      <div className="space-y-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="text-xs font-medium text-white/60">Journal</div>
          <div className="text-base font-semibold text-white">
            Your trading week
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat label="Trades" value="18" />
            <MiniStat label="Win rate" value="61%" />
            <MiniStat label="P/L" value="+2.3R" accent />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="text-xs font-medium text-white/60">Notes</div>
          <div className="mt-2 text-sm text-white/75">
            Stayed disciplined on risk. Best performance during NY open.
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "settings") {
    return (
      <div className="space-y-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="text-xs font-medium text-white/60">Settings</div>
          <div className="text-base font-semibold text-white">
            Alerts & automation
          </div>
        </div>
        {[
          { label: "Push notifications", value: "On" },
          { label: "Discord alerts", value: "On" },
          { label: "TradeLocker sync", value: "Every 5 min" },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 backdrop-blur-md"
          >
            <span className="text-white/70">{row.label}</span>
            <span className="font-medium text-white">{row.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TradingCalendarMobile
        dailyStats={
          demoCalendarDailyStats as unknown as TradingCalendarDailyStat[]
        }
        selectedDate={selectedDate}
        onSelectDateAction={onSelectDateAction}
      />

      <button
        type="button"
        onClick={() =>
          onNavigateAction({ kind: "insight", insightId: "best-time" })
        }
        className="w-full rounded-3xl border border-orange-500/20 bg-orange-500/10 p-4 text-left backdrop-blur-md transition-colors hover:bg-orange-500/12 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden"
      >
        <div className="text-xs font-medium text-orange-200">Insight</div>
        <div className="mt-1 text-sm font-semibold text-white">
          Best time to trade
        </div>
        <div className="mt-2 text-xs text-white/70">
          Window opens in ~10 min
        </div>
      </button>
    </div>
  );
};

const BottomNav = ({
  route,
  onNavigateAction,
}: {
  route: TraderLaunchpadMobileRoute;
  onNavigateAction: (route: TraderLaunchpadMobileRoute) => void;
}) => {
  const activeTab = route.kind === "tab" ? route.tab : "home";
  const items: {
    tab: TraderLaunchpadMobileTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { tab: "home", label: "Home", icon: <Home className="h-5 w-5" /> },
    {
      tab: "signals",
      label: "Signals",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      tab: "journal",
      label: "Journal",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      tab: "settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="absolute right-0 bottom-0 left-0">
      <div className="mx-4 mb-4 rounded-3xl border border-white/10 bg-black/50 p-2 backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-1">
          {items.map((it) => {
            const isActive = activeTab === it.tab;
            return (
              <button
                key={it.tab}
                type="button"
                onClick={() => onNavigateAction({ kind: "tab", tab: it.tab })}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/6 hover:text-white/80",
                )}
              >
                {it.icon}
                {it.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
      <span className="text-white/60">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
};

const MiniStat = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 p-2 text-center",
        accent && "border-orange-500/20 bg-orange-500/10",
      )}
    >
      <div className="text-[10px] text-white/55">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-white">{value}</div>
    </div>
  );
};
