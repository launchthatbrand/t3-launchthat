"use client";

import { AlertTriangle, Calendar, Sparkles, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";
import {
  demoCalendarDailyStats as untypedCalendar,
  demoInsights as untypedInsights,
} from "@acme/demo-data";

import { cn } from "@acme/ui";

type CalendarDay = {
  date: string; // YYYY-MM-DD
  pnl: number;
  wins: number;
  losses: number;
};

type Insight = {
  id: string;
  kind: "positive" | "warning" | "neutral";
  title: string;
  description: string;
  icon: "trendingUp" | "alertCircle" | "calendar";
};

const parseDay = (d: string) => {
  const [y, m, day] = d.split("-").map((x) => Number(x));
  const dt = new Date(y ?? 1970, (m ?? 1) - 1, day ?? 1);
  return dt;
};

const formatDow = (d: string) => {
  const dt = parseDay(d);
  return dt.toLocaleDateString(undefined, { weekday: "short" });
};

const formatDom = (d: string) => {
  const dt = parseDay(d);
  return dt.getDate();
};

export const JournalAnalyticsAnimation = ({
  cycleMs = 5200,
  className,
}: {
  cycleMs?: number;
  className?: string;
}) => {
  const calendar = useMemo(() => untypedCalendar as unknown as CalendarDay[], []);
  const insights = useMemo(() => untypedInsights as unknown as Insight[], []);

  const lastDays = useMemo(() => {
    // Keep it deterministic: sort and take most recent 7
    const sorted = [...calendar].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(Math.max(0, sorted.length - 7));
  }, [calendar]);

  const bestDay = useMemo(() => {
    return lastDays.reduce<CalendarDay | null>((best, cur) => {
      if (!best) return cur;
      return cur.pnl > best.pnl ? cur : best;
    }, null);
  }, [lastDays]);

  const worstDay = useMemo(() => {
    return lastDays.reduce<CalendarDay | null>((worst, cur) => {
      if (!worst) return cur;
      return cur.pnl < worst.pnl ? cur : worst;
    }, null);
  }, [lastDays]);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => {
      setStep((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
    }, Math.max(3600, cycleMs));
    return () => window.clearInterval(t);
  }, [cycleMs, paused]);

  return (
    <div
      className={cn(
        "relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm",
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top status bar */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-white/80">
          {step === 0
            ? "Calendar check"
            : step === 1
              ? "Recent insights"
              : "AI coach"}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/65">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              paused
                ? "bg-white/30"
                : "bg-orange-500/70 shadow-[0_0_10px_rgba(249,115,22,0.45)]",
            )}
          />
          <span>{paused ? "Paused" : "Live"}</span>
        </div>
      </div>

      <div className="relative mt-4 min-h-[180px]">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-[11px] text-white/60">
                  <Calendar className="h-4 w-4 text-white/35" />
                  <span>Last 7 sessions</span>
                </div>
                <div className="text-[11px] text-white/55">
                  Hover to pause
                </div>
              </div>

              <div className="relative mt-3 grid grid-cols-7 gap-2">
                {/* scanning bar */}
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-transparent via-orange-500/10 to-transparent blur-[2px]"
                  animate={{ x: ["-30%", "260%"] }}
                  transition={{
                    duration: 2.6,
                    ease: "easeInOut",
                    repeat: paused ? 0 : Infinity,
                    repeatType: "loop",
                  }}
                />

                {lastDays.map((d) => {
                  const isBest = bestDay?.date === d.date;
                  const isWorst = worstDay?.date === d.date;
                  const pnlPos = d.pnl >= 0;
                  return (
                    <div
                      key={d.date}
                      className={cn(
                        "relative overflow-hidden rounded-xl border bg-white/5 p-2 text-center",
                        "border-white/10",
                        pnlPos ? "shadow-[0_0_0_1px_rgba(16,185,129,0.08)]" : "",
                      )}
                    >
                      <div className="text-[10px] font-medium text-white/55">
                        {formatDow(d.date)}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-white">
                        {formatDom(d.date)}
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-[10px] font-medium",
                          pnlPos ? "text-emerald-300/90" : "text-rose-300/90",
                        )}
                      >
                        {pnlPos ? "+" : ""}
                        {d.pnl}
                      </div>

                      {(isBest || isWorst) && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-linear-to-r from-transparent via-white/30 to-transparent" />
                      )}
                      {isBest && (
                        <div className="pointer-events-none absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.45)]" />
                      )}
                      {isWorst && (
                        <div className="pointer-events-none absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-400/80 shadow-[0_0_10px_rgba(244,63,94,0.45)]" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-white/60">
                <span className="text-white/80">AI note:</span>{" "}
                {bestDay && worstDay
                  ? `Your strongest session was ${formatDow(bestDay.date)} (+${bestDay.pnl}). Watch risk on ${formatDow(worstDay.date)} (${worstDay.pnl}).`
                  : "We’re summarizing your last sessions…"}
              </div>
            </motion.div>
          ) : step === 1 ? (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-[11px] text-white/60">
                  <TrendingUp className="h-4 w-4 text-white/35" />
                  <span>Insights from recent trades</span>
                </div>
                <div className="text-[11px] text-white/55">Auto-generated</div>
              </div>

              <div className="mt-3 space-y-2">
                {insights.slice(0, 3).map((ins) => {
                  const tone =
                    ins.kind === "positive"
                      ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-200"
                      : ins.kind === "warning"
                        ? "border-amber-500/20 bg-amber-500/8 text-amber-200"
                        : "border-white/10 bg-white/5 text-white/70";
                  const Icon =
                    ins.kind === "warning" ? AlertTriangle : Sparkles;

                  return (
                    <motion.div
                      key={ins.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={cn(
                        "rounded-xl border px-3 py-2",
                        tone,
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white">
                            {ins.title}
                          </div>
                          <div className="mt-0.5 text-[11px] text-white/60">
                            {ins.description}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-white/60">
                <span className="text-white/80">Next:</span> turn insights into
                plan edits & reminders.
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="coach"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-[11px] text-white/60">
                  <Sparkles className="h-4 w-4 text-white/35" />
                  <span>AI advice</span>
                </div>
                <div className="text-[11px] text-white/55">Coach mode</div>
              </div>

              <div className="mt-3 grid gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left"
                >
                  <div className="text-[10px] font-semibold text-white/60">
                    Suggestion
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    Tighten your stop after 2 losses.
                  </div>
                  <div className="mt-2 text-[11px] leading-relaxed text-white/65">
                    You’re most profitable when you stop early on red days.
                    Add a rule:{" "}
                    <span className="text-white/85">
                      “Pause trading for 10 minutes after 2 losses.”
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut", delay: 0.06 }}
                  className="rounded-2xl border border-orange-500/20 bg-orange-500/8 p-3 text-left"
                >
                  <div className="text-[10px] font-semibold text-orange-200/80">
                    Automate
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    Add a plan violation alert
                  </div>
                  <div className="mt-2 text-[11px] leading-relaxed text-white/65">
                    If you trade outside your window, we’ll warn you and block
                    entries:{" "}
                    <span className="text-orange-100">
                      “Violating Trading Plan”
                    </span>
                    .
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

