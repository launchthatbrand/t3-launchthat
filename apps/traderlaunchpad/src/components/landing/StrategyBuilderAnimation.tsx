"use client";

import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";

type PlanTemplate = {
  id: string;
  name: string;
  pill: string;
  rules: Array<{ k: string; v: string }>;
  previewLines: Array<React.ReactNode>;
};

const TEMPLATES: Array<PlanTemplate> = [
  {
    id: "ny-open-breakout",
    name: "NY Open Breakout",
    pill: "Starter",
    rules: [
      { k: "Entry window", v: "09:30–10:05" },
      { k: "Max trades/day", v: "2" },
      { k: "Daily stop", v: "-1.0R" },
      { k: "Risk / trade", v: "0.5%" },
    ],
    previewLines: [
      <>
        <span className="text-orange-200">IF</span> time ∈ 09:30–10:05{" "}
        <span className="text-orange-200">AND</span> first 5m range breaks
      </>,
      <>
        <span className="text-orange-200">THEN</span> enter on retest • SL below
        range
      </>,
      <>
        <span className="text-orange-200">STOP</span> after -1.0R{" "}
        <span className="text-orange-200">OR</span> 2 trades
      </>,
    ],
  },
  {
    id: "trend-pullback",
    name: "Trend Pullback",
    pill: "Proven",
    rules: [
      { k: "Entry window", v: "10:00–11:30" },
      { k: "Max trades/day", v: "3" },
      { k: "Daily stop", v: "-1.2R" },
      { k: "Risk / trade", v: "0.5%" },
    ],
    previewLines: [
      <>
        <span className="text-orange-200">IF</span> bias = up{" "}
        <span className="text-orange-200">AND</span> pullback to VWAP
      </>,
      <>
        <span className="text-orange-200">THEN</span> enter on confirmation
        candle
      </>,
      <>
        <span className="text-orange-200">REMIND</span> 10m before best window
      </>,
    ],
  },
  {
    id: "news-fade",
    name: "News Fade",
    pill: "Advanced",
    rules: [
      { k: "Entry window", v: "News + 5m" },
      { k: "Max trades/day", v: "2" },
      { k: "Daily stop", v: "-0.8R" },
      { k: "Risk / trade", v: "0.4%" },
    ],
    previewLines: [
      <>
        <span className="text-orange-200">IF</span> deviation &gt; 2σ{" "}
        <span className="text-orange-200">AND</span> rsi &gt; 80
      </>,
      <>
        <span className="text-orange-200">THEN</span> fade to mean • scale out
      </>,
      <>
        <span className="text-orange-200">GUARD</span> block entries after 2
        losses
      </>,
    ],
  },
];

export const StrategyBuilderAnimation = ({
  cycleMs = 4200,
}: {
  cycleMs?: number;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = useMemo(() => TEMPLATES[activeIndex]!, [activeIndex]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TEMPLATES.length);
    }, Math.max(2500, cycleMs));
    return () => window.clearInterval(t);
  }, [cycleMs]);

  return (
    <div className="mt-7 grid gap-4 md:grid-cols-2">
      {/* Pick a template */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-white/80">Pick a template</div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-200">
            AI guided
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {TEMPLATES.map((t, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={t.id}
                className={[
                  "relative flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition-colors",
                  isActive
                    ? "border-orange-500/35 bg-orange-500/10 text-white"
                    : "border-white/10 bg-white/5 text-white/60",
                ].join(" ")}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.name}</div>
                  <div className="mt-0.5 text-[11px] text-white/45">{t.pill}</div>
                </div>

                {isActive && (
                  <motion.div
                    layoutId="templateCheck"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="ml-3 inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200"
                  >
                    Selected
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selection caret hint */}
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] text-white/55">
          We’ll turn this into a simple checklist:{" "}
          <span className="text-white/80">when to trade</span>,{" "}
          <span className="text-white/80">when to stop</span>, and{" "}
          <span className="text-white/80">what to avoid</span>.
        </div>
      </div>

      {/* Plan preview */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-white/80">Trading plan</div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70">
            Active rules
          </div>
        </div>

        <div className="relative mt-4 min-h-[176px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <div className="grid grid-cols-2 gap-2">
                {active.rules.map((row) => (
                  <div
                    key={row.k}
                    className="rounded-xl border border-white/10 bg-white/5 p-2"
                  >
                    <div className="text-[10px] font-medium text-white/55">
                      {row.k}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-white">
                      {row.v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/70">
                {active.previewLines.map((line, i) => (
                  <div key={i} className={i === 0 ? "" : "mt-1.5"}>
                    {line}
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-white/55">
                <div>
                  Auto-updated from your journal + market context{" "}
                  <span className="text-white/35">(demo)</span>
                </div>
                <div className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-200">
                  draft → active
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

