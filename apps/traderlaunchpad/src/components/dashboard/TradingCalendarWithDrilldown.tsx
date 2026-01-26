"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { addDays, format as formatDate } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Calendar as DayCalendar } from "@acme/ui/calendar";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@acme/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

import { TradingCalendarMobile } from "~/components/dashboard/TradingCalendarMobile";
import { TradingCalendarPanel } from "~/components/dashboard/TradingCalendarPanel";

export interface TradingCalendarWithDrilldownDailyStat {
  date: string;
  pnl: number;
  wins: number;
  losses: number;
  unrealizedPnl?: number;
}

export interface TradingCalendarWithDrilldownTradeRow {
  id: string;
  tradeDate: string; // yyyy-MM-dd
  symbol: string;
  type: "Long" | "Short";
  reviewed: boolean;
  reason: string;
  pnl: number;
  qtyClosed?: number;
  fees?: number;
  commission?: number;
  swap?: number;
  openAtMs?: number;
  closedAtMs?: number;
  openPrice?: number;
  closePrice?: number;
  externalPositionId?: string;
  openOrderId?: string;
  closeOrderId?: string;
  openTradeId?: string;
  closeTradeId?: string;
}

export interface TradingCalendarWithDrilldownProps {
  dailyStats: TradingCalendarWithDrilldownDailyStat[];
  trades: TradingCalendarWithDrilldownTradeRow[];
  selectedDate: string | null;
  onSelectDateAction: (next: string | null) => void;
  getTradeHrefAction: (tradeId: string) => string;

  className?: string;
  mobileCalendarClassName?: string;
  desktopCalendarClassName?: string;
  desktopCalendarContentClassName?: string;
}

const useIsMobileCalendarUi = (): boolean => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
};

export const TradingCalendarWithDrilldown = ({
  dailyStats,
  trades,
  selectedDate,
  onSelectDateAction,
  getTradeHrefAction,
  className,
  mobileCalendarClassName,
  desktopCalendarClassName,
  desktopCalendarContentClassName,
}: TradingCalendarWithDrilldownProps) => {
  const isMobileCalendarUi = useIsMobileCalendarUi();
  const [expandedIdsByTradeId, setExpandedIdsByTradeId] = React.useState<
    Record<string, boolean>
  >({});

  const selectedDateObj = React.useMemo(() => {
    if (!selectedDate) return undefined;
    const d = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return undefined;
    return d;
  }, [selectedDate]);

  const selectedDateLabel = React.useMemo(() => {
    if (!selectedDateObj) return "All dates";
    return formatDate(selectedDateObj, "MMM d, yyyy");
  }, [selectedDateObj]);

  const formatPnl = React.useCallback((value: number): string => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  const handleSelectDate = React.useCallback(
    (d: Date | undefined) => {
      if (!d) {
        onSelectDateAction(null);
        return;
      }
      onSelectDateAction(formatDate(d, "yyyy-MM-dd"));
    },
    [onSelectDateAction],
  );

  const handleShiftSelectedDate = React.useCallback(
    (deltaDays: number) => {
      if (!selectedDateObj) return;
      const next = addDays(selectedDateObj, deltaDays);
      onSelectDateAction(formatDate(next, "yyyy-MM-dd"));
    },
    [onSelectDateAction, selectedDateObj],
  );

  const formatHoldTime = React.useCallback((durationMs: number): string => {
    const ms = Math.max(0, Math.floor(durationMs));
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours <= 0) return `${minutes}m`;
    if (minutes <= 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }, []);

  const selectedDayStat = React.useMemo(() => {
    if (!selectedDate) return null;
    return dailyStats.find((s) => s.date === selectedDate) ?? null;
  }, [dailyStats, selectedDate]);

  const mobileDrawerTrades = React.useMemo(() => {
    if (!selectedDate) return [];
    return trades.filter((trade) => trade.tradeDate === selectedDate);
  }, [selectedDate, trades]);

  return (
    <div className={cn("space-y-0", className)}>
      <TradingCalendarMobile
        dailyStats={dailyStats}
        selectedDate={selectedDate}
        onSelectDateAction={onSelectDateAction}
        className={cn("md:hidden", mobileCalendarClassName)}
      />

      <TradingCalendarPanel
        dailyStats={dailyStats}
        selectedDate={selectedDate}
        onSelectDateAction={onSelectDateAction}
        className={cn("min-h-[340px] hidden md:block", desktopCalendarClassName)}
        contentClassName={cn("h-full", desktopCalendarContentClassName)}
      />

      {/* Mobile: selecting a calendar day opens a drill-down drawer (Option A: close clears filter). */}
      <Drawer
        open={isMobileCalendarUi && Boolean(selectedDate)}
        onOpenChange={(open) => {
          if (!open) onSelectDateAction(null);
        }}
      >
        <DrawerContent className="border-border/40 bg-background/95 text-foreground backdrop-blur">
          <DrawerHeader>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-9 w-9 text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
              onClick={() => onSelectDateAction(null)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>

            <DrawerTitle>Day details</DrawerTitle>
            <DrawerDescription className="text-muted-foreground">
              {selectedDate ? selectedDateLabel : "Pick a day to drill in."}
            </DrawerDescription>

            <div className="mt-3 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 border-border/60 bg-transparent text-foreground hover:bg-foreground/5 hover:text-foreground"
                onClick={() => handleShiftSelectedDate(-1)}
                disabled={!selectedDate}
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 flex-1 border-border/60 bg-transparent text-foreground hover:bg-foreground/5 hover:text-foreground"
                    disabled={!selectedDate}
                  >
                    <Calendar className="mr-2 h-4 w-4 text-orange-300" />
                    <span className="truncate">{selectedDateLabel}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-border/40 bg-background/95 p-3 text-foreground backdrop-blur">
                  <DayCalendar
                    mode="single"
                    selected={selectedDateObj}
                    onSelect={handleSelectDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 border-border/60 bg-transparent text-foreground hover:bg-foreground/5 hover:text-foreground"
                onClick={() => handleShiftSelectedDate(1)}
                disabled={!selectedDate}
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-4">
            <AnimatePresence mode="wait" initial={false}>
              {selectedDate ? (
                <motion.div
                  key={selectedDate}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="text-[11px] text-white/60">PnL</div>
                      <div
                        className={cn(
                          "mt-1 text-base font-semibold tabular-nums",
                          (selectedDayStat?.pnl ?? 0) >= 0
                            ? "text-orange-200"
                            : "text-red-200",
                        )}
                      >
                        {(selectedDayStat?.pnl ?? 0) >= 0 ? "+" : ""}
                        {formatPnl(selectedDayStat?.pnl ?? 0)}
                      </div>
                    {typeof selectedDayStat?.unrealizedPnl === "number" &&
                    Number.isFinite(selectedDayStat.unrealizedPnl) &&
                    selectedDayStat.unrealizedPnl !== 0 ? (
                      <div
                        className={cn(
                          "mt-1 text-[10px] font-medium tabular-nums",
                          selectedDayStat.unrealizedPnl >= 0
                            ? "text-emerald-200"
                            : "text-rose-200",
                        )}
                      >
                        Unrealized {selectedDayStat.unrealizedPnl >= 0 ? "+" : ""}
                        {formatPnl(selectedDayStat.unrealizedPnl)}
                      </div>
                    ) : null}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="text-[11px] text-white/60">Wins</div>
                      <div className="mt-1 text-base font-semibold tabular-nums text-white/90">
                        {selectedDayStat?.wins ?? 0}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="text-[11px] text-white/60">Losses</div>
                      <div className="mt-1 text-base font-semibold tabular-nums text-white/90">
                        {selectedDayStat?.losses ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 text-sm font-semibold text-white/90">
                      Trades ({mobileDrawerTrades.length})
                    </div>
                    <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                      {mobileDrawerTrades.length > 0 ? (
                        mobileDrawerTrades.map((trade) => (
                          <div
                            key={trade.id}
                            className="rounded-lg border border-white/10 bg-white/3 p-3"
                          >
                            <Link
                              href={getTradeHrefAction(trade.id)}
                              className="flex items-center justify-between transition-colors hover:text-white"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <span className="truncate">{trade.symbol}</span>
                                  <span
                                    className={cn(
                                      "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                                      trade.type === "Long"
                                        ? "bg-emerald-500/10 text-emerald-300"
                                        : "bg-red-500/10 text-red-300",
                                    )}
                                  >
                                    {trade.type}
                                  </span>
                                  <span
                                    className={cn(
                                      "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                                      trade.reviewed
                                        ? "bg-emerald-500/10 text-emerald-300"
                                        : "bg-amber-500/10 text-amber-300",
                                    )}
                                  >
                                    {trade.reviewed ? "Reviewed" : "Needs Review"}
                                  </span>
                                </div>
                                <div className="text-xs text-white/60">{trade.reason}</div>
                              </div>
                              <div
                                className={cn(
                                  "shrink-0 pl-3 text-sm font-semibold tabular-nums",
                                  trade.pnl >= 0 ? "text-emerald-300" : "text-red-300",
                                )}
                              >
                                {trade.pnl >= 0 ? "+" : ""}
                                {formatPnl(trade.pnl)}
                              </div>
                            </Link>

                            <div className="mt-1 text-[11px] text-white/70">
                              {typeof trade.qtyClosed === "number" &&
                              Number.isFinite(trade.qtyClosed) ? (
                                <>
                                  Size {trade.qtyClosed}
                                  <span className="px-1.5 text-white/30">•</span>
                                </>
                              ) : null}
                              {typeof trade.openAtMs === "number" &&
                              typeof trade.closedAtMs === "number" &&
                              Number.isFinite(trade.openAtMs) &&
                              Number.isFinite(trade.closedAtMs) &&
                              trade.closedAtMs > trade.openAtMs ? (
                                <>
                                  Hold {formatHoldTime(trade.closedAtMs - trade.openAtMs)}
                                  <span className="px-1.5 text-white/30">•</span>
                                </>
                              ) : null}
                              {typeof trade.fees === "number" && Number.isFinite(trade.fees) ? (
                                <>
                                  Fees {trade.fees >= 0 ? "+" : ""}
                                  {formatPnl(trade.fees)}
                                </>
                              ) : null}
                              {typeof trade.openPrice === "number" &&
                              typeof trade.closePrice === "number" &&
                              Number.isFinite(trade.openPrice) &&
                              Number.isFinite(trade.closePrice) ? (
                                <>
                                  <span className="px-1.5 text-white/30">•</span>
                                  {formatPnl(trade.openPrice)} → {formatPnl(trade.closePrice)}
                                </>
                              ) : null}
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-3">
                              {Boolean(
                                trade.openOrderId ??
                                  trade.closeOrderId ??
                                  trade.openTradeId ??
                                  trade.closeTradeId ??
                                  trade.externalPositionId,
                              ) && (
                                <button
                                  type="button"
                                  className="text-[11px] font-medium text-white/60 underline underline-offset-2 hover:text-white"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setExpandedIdsByTradeId((prev) => ({
                                      ...prev,
                                      [trade.id]: !prev[trade.id],
                                    }));
                                  }}
                                >
                                  {expandedIdsByTradeId[trade.id] ? "Hide IDs" : "Show IDs"}
                                </button>
                              )}

                              {typeof trade.commission === "number" ||
                              typeof trade.swap === "number" ? (
                                <div className="ml-auto text-[11px] text-white/55 tabular-nums">
                                  {typeof trade.commission === "number" &&
                                  Number.isFinite(trade.commission)
                                    ? `C:${trade.commission >= 0 ? "+" : ""}${formatPnl(
                                        trade.commission,
                                      )}`
                                    : null}
                                  {typeof trade.swap === "number" && Number.isFinite(trade.swap)
                                    ? ` S:${trade.swap >= 0 ? "+" : ""}${formatPnl(trade.swap)}`
                                    : null}
                                </div>
                              ) : null}
                            </div>

                            {expandedIdsByTradeId[trade.id] ? (
                              <div className="mt-2 space-y-1 rounded-md border border-white/10 bg-black/30 p-2 text-[11px] text-white/70">
                                {trade.externalPositionId ? (
                                  <div className="break-all">
                                    <span className="text-white/50">Position:</span>{" "}
                                    {trade.externalPositionId}
                                  </div>
                                ) : null}
                                {trade.openOrderId ? (
                                  <div className="break-all">
                                    <span className="text-white/50">Open order:</span>{" "}
                                    {trade.openOrderId}
                                  </div>
                                ) : null}
                                {trade.closeOrderId ? (
                                  <div className="break-all">
                                    <span className="text-white/50">Close order:</span>{" "}
                                    {trade.closeOrderId}
                                  </div>
                                ) : null}
                                {trade.openTradeId ? (
                                  <div className="break-all">
                                    <span className="text-white/50">Open trade:</span>{" "}
                                    {trade.openTradeId}
                                  </div>
                                ) : null}
                                {trade.closeTradeId ? (
                                  <div className="break-all">
                                    <span className="text-white/50">Close trade:</span>{" "}
                                    {trade.closeTradeId}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-white/10 bg-white/3 p-4 text-sm text-white/70">
                          No trades on this day.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

