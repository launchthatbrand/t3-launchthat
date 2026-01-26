"use client";

import { ArrowRight, Check, Info } from "lucide-react";
import { Card, cn } from "@acme/ui";

import { Button } from "@acme/ui/moving-border";
import Link from "next/link";
import React from "react";
import { Tooltip as TooltipCard } from "@acme/ui/components/ui/tooltip-card";
import { motion } from "framer-motion";

const FEATURE_TOOLTIPS: Record<string, React.ReactNode> = {
  "Analytics dashboard":
    "Your performance overview: win rate, profit factor, expectancy, and key streaks.",
  "Number of broker accounts":
    "How many broker accounts you can link and sync trades from under your plan.",
  "Storage amount":
    "Total space for screenshots, attachments, and notes stored with your trades.",
  "Calendar view":
    "See performance by day/week/month with a heatmap + session summaries.",
  "Notes & comments":
    "Add context to trades, tag patterns, and keep post-session review notes.",
  "Winning percentage":
    "Automatic win rate calculation based on your synced or logged trades.",
  "Customizable trade log":
    "Filter/sort columns, customize fields, and export your log when needed.",
  "Automatic trade imports":
    "Pull trades from your broker so you don’t have to enter everything manually.",
  "Trading plan pairs":
    "How many symbols/pairs you can include in your trading plan rules and tracking.",
  "AI insights & reminders":
    "AI insights, nudges, and reminders based on your journal + trading plan.",
  "AI credit (monthly)":
    "Free tier includes a small monthly AI credit to cover basic insights and reminders.",
  "Session timing heatmaps":
    "Highlight which hours/days you perform best so you can focus on your edge windows.",
  "Signal stream":
    "Central feed for trade events + key alerts (entries, exits, rule violations).",
  "Alerts (push + Discord)":
    "Get notified for important events and guardrails; Discord is great for realtime workflows.",
  "Risk guardrails":
    "Optional limits like max daily loss, max trades/day, and “stop trading” triggers.",
  "Backtest exports":
    "Export your data for analysis elsewhere (CSV now; PDFs later for shareable reports).",
  "Organization leaderboards":
    "Let members join your organization and view private, org-scoped leaderboards.",
  "Discord trade stream bot":
    "Streams your org’s trades to Discord with community-focused automations and moderation-friendly controls.",
  "Customizable AI (org)":
    "Create and fine-tune AI trading plan templates that your organization members can apply.",
};

interface FeatureRow {
  label: string;
  free: React.ReactNode;
  standard: React.ReactNode;
  pro: React.ReactNode;
}

const useStickyCompact = (topOffsetPx: number) => {
  // A sentinel placed at the top of the comparison table. We shrink the pricing
  // cards only once the sentinel reaches the sticky header region.
  const tableStartRef = React.useRef<HTMLDivElement | null>(null);
  const [isCompact, setIsCompact] = React.useState(false);

  React.useEffect(() => {
    const el = tableStartRef.current;
    if (!el) return;

    // Scroll/resize measurement (raf-throttled) is the most deterministic here
    // and avoids edge-cases when scrolling very fast.
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        setIsCompact(rect.top <= topOffsetPx + 2);
      });
    };

    onScroll();
    globalThis.addEventListener("scroll", onScroll, { passive: true });
    globalThis.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      globalThis.removeEventListener("scroll", onScroll);
      globalThis.removeEventListener("resize", onScroll);
    };
  }, [topOffsetPx]);

  return { tableStartRef, isCompact };
};

export const PricingSection = () => {
  // Match the page’s fixed header spacing.
  const stickyTop = 70; // 24 * 4px
  const { tableStartRef, isCompact } = useStickyCompact(stickyTop);

  const yes = <Check className="h-5 w-5 text-emerald-400" />;
  const freePrice = "$0";
  const standardPrice = "$9.99";
  const proPrice = "$29.99";
  const freePeriodLabel = "Forever";

  type FeatureEntry =
    | { kind: "section"; title: string }
    | { kind: "feature"; row: FeatureRow };

  const entries: FeatureEntry[] = [
    { kind: "section", title: "Trading Journal" },
    { kind: "feature", row: { label: "Analytics dashboard", free: yes, standard: yes, pro: yes } },
    { kind: "feature", row: { label: "Calendar view", free: yes, standard: yes, pro: yes } },
    { kind: "feature", row: { label: "Notes & comments", free: yes, standard: yes, pro: yes } },
    { kind: "feature", row: { label: "Winning percentage", free: yes, standard: yes, pro: yes } },
    { kind: "feature", row: { label: "Customizable trade log", free: yes, standard: yes, pro: yes } },
    {
      kind: "feature",
      row: {
        label: "Storage amount",
        free: <span className="text-sm font-medium text-foreground/85">2 GB</span>,
        standard: <span className="text-sm font-medium text-foreground/85">10 GB</span>,
        pro: <span className="text-sm font-medium text-orange-200">50 GB</span>,
      },
    },
    {
      kind: "feature",
      row: {
        label: "Number of broker accounts",
        free: <span className="text-sm font-medium text-foreground/85">2 accounts</span>,
        standard: <span className="text-sm font-medium text-foreground/85">5 accounts</span>,
        pro: <span className="text-sm font-medium text-orange-200">10 accounts</span>,
      },
    },
    {
      kind: "feature",
      row: {
        label: "Automatic trade imports",
        free: <span className="text-sm font-medium text-muted-foreground">Limited</span>,
        standard: <span className="text-sm font-medium text-orange-200">Unlimited</span>,
        pro: <span className="text-sm font-medium text-orange-200">Unlimited</span>,
      },
    },
    {
      kind: "feature",
      row: {
        label: "Backtest exports",
        free: <span className="text-sm font-medium text-muted-foreground">CSV</span>,
        standard: <span className="text-sm font-medium text-muted-foreground">CSV</span>,
        pro: <span className="text-sm font-medium text-orange-200">CSV + PDF</span>,
      },
    },

    { kind: "section", title: "Trading Plan" },
    {
      kind: "feature",
      row: {
        label: "Trading plan pairs",
        free: <span className="text-sm font-medium text-foreground/85">Max 5</span>,
        standard: <span className="text-sm font-medium text-foreground/85">Max 10</span>,
        pro: <span className="text-sm font-medium text-orange-200">Max 10</span>,
      },
    },
    {
      kind: "feature",
      row: {
        label: "AI credit (monthly)",
        free: <div className="flex flex-col gap-2 items-start"><span className="text-sm font-medium text-foreground/85">$5 / mo</span><sub className="text-muted-foreground">~50 AI insights</sub></div>,
        standard: <span className="text-sm font-medium text-orange-200">Unlimited</span>,
        pro: <span className="text-sm font-medium text-orange-200">Unlimited</span>,
      },
    },
    {
      kind: "feature",
      row: {
        label: "AI insights & reminders",
        free: <span className="text-sm font-medium text-muted-foreground">Limited</span>,
        standard: <span className="text-sm font-medium text-orange-200">Standard AI</span>,
        pro: <span className="text-sm font-medium text-orange-200">Customizable</span>,
      },
    },
    { kind: "feature", row: { label: "Session timing heatmaps", free: yes, standard: yes, pro: yes } },
    {
      kind: "feature",
      row: {
        label: "Risk guardrails",
        free: <span className="text-sm font-medium text-muted-foreground">Core</span>,
        standard: <span className="text-sm font-medium text-orange-200">Advanced</span>,
        pro: <span className="text-sm font-medium text-orange-200">Advanced</span>,
      },
    },
    {
      kind: "feature",
      row: {
        label: "Alerts (push + Discord)",
        free: <span className="text-sm font-medium text-muted-foreground">Standard</span>,
        standard: <span className="text-sm font-medium text-orange-200">Standard</span>,
        pro: <span className="text-sm font-medium text-orange-200">Priority</span>,
      },
    },
    {
      kind: "feature",
      row: {
        label: "Signal stream",
        free: <span className="text-sm font-medium text-muted-foreground">Basic</span>,
        standard: <span className="text-sm font-medium text-orange-200">Advanced</span>,
        pro: <span className="text-sm font-medium text-orange-200">Advanced</span>,
      },
    },
    {
      kind: "feature",
      row: {
        label: "Organization leaderboards",
        free: <span className="text-sm font-medium text-muted-foreground">—</span>,
        standard: <span className="text-sm font-medium text-muted-foreground">—</span>,
        pro: yes,
      },
    },
    {
      kind: "feature",
      row: {
        label: "Discord trade stream bot",
        free: <span className="text-sm font-medium text-muted-foreground">—</span>,
        standard: <span className="text-sm font-medium text-muted-foreground">—</span>,
        pro: yes,
      },
    },
    {
      kind: "feature",
      row: {
        label: "Customizable AI (org)",
        free: <span className="text-sm font-medium text-muted-foreground">—</span>,
        standard: <span className="text-sm font-medium text-muted-foreground">—</span>,
        pro: yes,
      },
    },
  ];

  return (
    <section className="relative container mx-auto mt-24 max-w-7xl px-4 pb-24 md:mt-32">
      <div className="mb-10 flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
          Compare our plans
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Start with the basics, then upgrade when you want more automation and
          more connected accounts.
        </p>
      </div>

      {/* Sticky header (pricing cards) */}
      <div className="grid gap-6 lg:grid-cols-4 lg:items-start">
        {/* Left spacer / description (NOT sticky) */}
        <Card className="hidden lg:block p-0">
          <div
            className={[
              "rounded-3xl border border-foreground/10 bg-foreground/3 backdrop-blur-md transition-all duration-500 ease-in-out",
              isCompact ? "p-5 opacity-80" : "p-8",
            ].join(" ")}
          >
            <div className="text-sm font-medium text-foreground/80">Included</div>
            <div
              className={[
                "mt-2 font-semibold text-foreground transition-all duration-500 ease-in-out",
                isCompact ? "text-xl" : "text-2xl",
              ].join(" ")}
            >
              Everything you need to demo the platform
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              Same experience for every visitor. Once you connect an account,
              this will switch to real broker data.
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="flex h-10 items-center justify-center rounded-xl border border-foreground/15 bg-transparent px-4 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5"
              >
                Try it out
              </Link>
            </div>
          </div>
        </Card>

        {/* Free + Standard + Pro (single glass panel) - sticky */}
        <div
          className={[
            "z-30 lg:col-span-3",
            "sticky self-start",
            "transition-[padding,transform,filter] duration-500 ease-in-out",
            isCompact ? "py-2" : "py-0",
          ].join(" ")}
          style={{ top: stickyTop }}
        >
          <Card className="rounded-3xl border border-foreground/12 bg-foreground/4 backdrop-blur-md">
            <div className="grid grid-cols-1 divide-y divide-foreground/10 md:grid-cols-3 md:divide-x md:divide-y-0">
              {/* Free */}
              <div
                className={[
                  "transition-[padding] duration-500 ease-in-out",
                  isCompact ? "p-5" : "p-8",
                ].join(" ")}
              >
                <div className="text-base font-semibold text-foreground">Free</div>
                <motion.div
                  layout
                  className="mt-2 overflow-hidden text-sm text-muted-foreground"
                  animate={{
                    opacity: isCompact ? 0 : 1,
                    maxHeight: isCompact ? 0 : 40,
                    y: isCompact ? -4 : 0,
                  }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  Basic access + a small AI credit to get started.
                </motion.div>

                <motion.div
                  layout
                  className={isCompact ? "mt-3 flex items-center justify-between gap-3" : "mt-4"}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div
                    layout
                    className={isCompact ? "text-2xl font-bold text-foreground" : "flex items-end gap-2"}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.div
                      layout
                      className={isCompact ? "text-2xl font-bold text-foreground" : "text-4xl font-bold text-foreground"}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {freePrice}
                    </motion.div>
                    <motion.div
                      layout
                      className="pb-1 text-sm text-foreground/50"
                      animate={{ opacity: isCompact ? 0 : 1, maxHeight: isCompact ? 0 : 24 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {freePeriodLabel}
                    </motion.div>
                  </motion.div>

                  <motion.div
                    layout
                    className={isCompact ? "" : "mt-5"}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link href="/sign-in" className="block">
                      <Button
                        as="div"
                        borderRadius="2rem"
                        containerClassName="w-full"
                        duration={5000}
                        className="bg-white gap-2 p-1 px-3 flex dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800 cursor-pointer"
                      >
                        <span className="w-full text-center font-bold">Get Started</span>
                        <span
                          className={cn(
                            "flex items-center justify-center rounded-full bg-black text-white",
                            isCompact ? "min-h-7 min-w-7" : "min-h-8 min-w-8",
                          )}
                        >
                          <ArrowRight className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                        </span>
                      </Button>
                    </Link>
                  </motion.div>
                </motion.div>
              </div>

              {/* Standard */}
              <div
                className={[
                  "transition-[padding] duration-500 ease-in-out",
                  isCompact ? "p-5" : "p-8",
                ].join(" ")}
              >
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-semibold text-foreground">Standard</div>
                  </div>

                  <motion.div
                    layout
                    className="mt-2 overflow-hidden text-sm text-muted-foreground"
                    animate={{
                      opacity: isCompact ? 0 : 1,
                      maxHeight: isCompact ? 0 : 40,
                      y: isCompact ? -4 : 0,
                    }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Standard AI + more accounts and plan pairs.
                  </motion.div>

                  <motion.div
                    layout
                    className={isCompact ? "mt-3 flex items-center justify-between gap-3" : "mt-4"}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.div
                      layout
                      className={isCompact ? "text-2xl font-bold text-foreground" : "flex items-end gap-2"}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.div
                        layout
                        className={isCompact ? "text-2xl font-bold text-foreground" : "text-4xl font-bold text-foreground"}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {standardPrice}
                      </motion.div>
                      <motion.div
                        layout
                        className="pb-1 text-sm text-foreground/50"
                        animate={{ opacity: isCompact ? 0 : 1, maxHeight: isCompact ? 0 : 24 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      >
                        per month
                      </motion.div>
                    </motion.div>

                    <motion.div
                      layout
                      className={isCompact ? "" : "mt-5"}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link href="/sign-in" className="block">
                        <Button
                          as="div"
                          borderRadius="2rem"
                          containerClassName="w-full"
                          duration={5000}
                          className="bg-white gap-2 p-1 px-3 flex dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800 cursor-pointer"
                        >
                          <span className="w-full text-center font-bold">Get Started</span>
                          <span
                            className={cn(
                              "flex items-center justify-center rounded-full bg-black text-white",
                              isCompact ? "min-h-7 min-w-7" : "min-h-8 min-w-8",
                            )}
                          >
                            <ArrowRight className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                          </span>
                        </Button>
                      </Link>
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              {/* Pro */}
              <div
                className={[
                  "transition-[padding] duration-500 ease-in-out",
                  isCompact ? "p-5" : "p-8",
                ].join(" ")}
              >
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-orange-500/12 via-transparent to-white/6 opacity-80" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-semibold text-foreground">Pro</div>
                    <motion.div
                      layout
                      className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-200"
                      animate={{
                        opacity: isCompact ? 0 : 1,
                        maxHeight: isCompact ? 0 : 32,
                        y: isCompact ? -4 : 0,
                      }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    >
                      Community owners
                    </motion.div>
                  </div>

                  <motion.div
                    layout
                    className="mt-2 overflow-hidden text-sm text-muted-foreground"
                    animate={{
                      opacity: isCompact ? 0 : 1,
                      maxHeight: isCompact ? 0 : 40,
                      y: isCompact ? -4 : 0,
                    }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Orgs + Discord upgrades + customizable AI templates.
                  </motion.div>

                  <motion.div
                    layout
                    className={isCompact ? "mt-3 flex items-center justify-between gap-3" : "mt-4"}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.div
                      layout
                      className={isCompact ? "text-2xl font-bold text-foreground" : "flex items-end gap-2"}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.div
                        layout
                        className={isCompact ? "text-2xl font-bold text-foreground" : "text-4xl font-bold text-foreground"}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {proPrice}
                      </motion.div>
                      <motion.div
                        layout
                        className="pb-1 text-sm text-foreground/50"
                        animate={{ opacity: isCompact ? 0 : 1, maxHeight: isCompact ? 0 : 24 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      >
                        per month
                      </motion.div>
                    </motion.div>

                    <motion.div
                      layout
                      className={isCompact ? "" : "mt-5"}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link href="/sign-in" className="block">
                        <Button
                          as="div"
                          borderRadius="2rem"
                          containerClassName="w-full"
                          duration={5000}
                          className="bg-white gap-2 p-1 px-3 flex dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800 cursor-pointer"
                        >
                          <span className="w-full text-center font-bold">Get Started</span>
                          <span
                            className={cn(
                              "flex items-center justify-center rounded-full bg-black text-white",
                              isCompact ? "min-h-7 min-w-7" : "min-h-8 min-w-8",
                            )}
                          >
                            <ArrowRight className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                          </span>
                        </Button>
                      </Link>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        {/* Comparison table (div-based) */}
        <div className="lg:col-span-4">
          {/* Sentinel: used to trigger compact mode once the table reaches the sticky header */}
          <div ref={tableStartRef} className="h-px w-full" aria-hidden="true" />
          <Card className="mt-2 overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/5 backdrop-blur-md">
            <div className="grid grid-cols-1 lg:grid-cols-4">
              <div className="hidden border-b border-foreground/10 px-6 py-5 text-sm font-medium text-muted-foreground lg:block">
                Features
              </div>
              <div className="hidden border-b border-foreground/10 px-6 py-5 text-sm font-medium text-muted-foreground lg:block">
                Free
              </div>
              <div className="hidden border-b border-foreground/10 px-6 py-5 text-sm font-medium text-muted-foreground lg:block">
                Standard
              </div>
              <div className="hidden border-b border-foreground/10 px-6 py-5 text-sm font-medium text-muted-foreground lg:block">
                Pro
              </div>

              {entries.map((entry) => {
                if (entry.kind === "section") {
                  return (
                    <div
                      key={`section:${entry.title}`}
                      className="col-span-1 border-b border-foreground/10 bg-foreground/4 px-6 py-4 text-sm font-semibold text-foreground/80 lg:col-span-4"
                    >
                      {entry.title}
                    </div>
                  );
                }

                const row = entry.row;
                return (
                  <React.Fragment key={row.label}>
                    <div className="border-b border-foreground/10 px-6 py-5 text-sm text-muted-foreground">
                      <TooltipCard
                        content={FEATURE_TOOLTIPS[row.label] ?? "Details coming soon."}
                      >
                        <div className="inline-flex cursor-default items-center gap-2">
                          <span className="text-foreground/90">{row.label}</span>
                          <Info className="h-4 w-4 text-foreground/35 hover:text-foreground/70" />
                        </div>
                      </TooltipCard>
                    </div>
                    <div className="border-b border-foreground/10 px-6 py-5">
                      <div className="flex items-center justify-start">{row.free}</div>
                    </div>
                    <div className="border-b border-foreground/10 px-6 py-5">
                      <div className="flex items-center justify-start">{row.standard}</div>
                    </div>
                    <div className="border-b border-foreground/10 px-6 py-5">
                      <div className="flex items-center justify-start">{row.pro}</div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
