"use client";

import { ArrowRight, Check } from "lucide-react";
import { Button, MovingBorder } from "@acme/ui/moving-border";

import Link from "next/link";
import React from "react";
import { cn } from "@acme/ui";
import { motion } from "framer-motion";

interface FeatureRow {
  label: string;
  basic: React.ReactNode;
  pro: React.ReactNode;
}

interface PricingCtaProps {
  href: string;
  isCompact: boolean;
  children: React.ReactNode;
}

const PricingCta = ({ href, isCompact, children }: PricingCtaProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-transparent p-1.5",
        isCompact ? "h-9 w-auto" : "h-11 w-full",
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-full">
        <Button
          borderRadius="1.75rem"
          className="bg-white dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800"
        >
          Borders are cool
        </Button>
      </div>
      <Link
        href={href}
        className={cn(
          "relative flex h-full w-full items-center justify-between rounded-full bg-white text-sm font-semibold text-black",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_18px_40px_rgba(0,0,0,0.35)]",
          "transition-transform hover:scale-[1.01] hover:bg-gray-100",
          isCompact ? "gap-3 px-4" : "gap-4 px-5",
        )}
      >
        <span className="truncate">{children}</span>
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-black text-white",
            isCompact ? "h-7 w-7" : "h-8 w-8",
          )}
        >
          <ArrowRight className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        </span>
      </Link>
    </div>
  );
};

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
  const standardPrice = "$49.99";
  const freePeriodLabel = "";

  const features: FeatureRow[] = [
    { label: "Analytics dashboard", basic: yes, pro: yes },
    {
      label: "Number of connected accounts",
      basic: (
        <span className="text-sm font-medium text-white/85">2 accounts</span>
      ),
      pro: (
        <span className="text-sm font-medium text-white/85">5 accounts</span>
      ),
    },
    {
      label: "Storage amount",
      basic: <span className="text-sm font-medium text-white/85">2 GB</span>,
      pro: <span className="text-sm font-medium text-white/85">10 GB</span>,
    },
    { label: "Calendar view", basic: yes, pro: yes },
    { label: "Notes & comments", basic: yes, pro: yes },
    { label: "Winning percentage", basic: yes, pro: yes },
    { label: "Customizable trade log", basic: yes, pro: yes },
    {
      label: "Automatic trade imports",
      basic: <span className="text-sm font-medium text-white/70">Limited</span>,
      pro: (
        <span className="text-sm font-medium text-orange-200">Unlimited</span>
      ),
    },
    // Extra rows to make the section ~2x longer
    { label: "AI trading coach insights", basic: yes, pro: yes },
    { label: "Session timing heatmaps", basic: yes, pro: yes },
    {
      label: "Signal stream",
      basic: <span className="text-sm font-medium text-white/70">Basic</span>,
      pro: (
        <span className="text-sm font-medium text-orange-200">Advanced</span>
      ),
    },
    {
      label: "Alerts (push + Discord)",
      basic: (
        <span className="text-sm font-medium text-white/70">Standard</span>
      ),
      pro: (
        <span className="text-sm font-medium text-orange-200">Priority</span>
      ),
    },
    {
      label: "Risk guardrails",
      basic: <span className="text-sm font-medium text-white/70">Core</span>,
      pro: (
        <span className="text-sm font-medium text-orange-200">Advanced</span>
      ),
    },
    {
      label: "Backtest exports",
      basic: <span className="text-sm font-medium text-white/70">CSV</span>,
      pro: (
        <span className="text-sm font-medium text-orange-200">CSV + PDF</span>
      ),
    },
    {
      label: "Webhook automations",
      basic: <span className="text-sm font-medium text-white/70">—</span>,
      pro: yes,
    },
    {
      label: "Multi-account summaries",
      basic: <span className="text-sm font-medium text-white/70">—</span>,
      pro: yes,
    },
  ];

  return (
    <section className="relative container mx-auto mt-24 max-w-7xl px-4 pb-24 md:mt-32">
      <div className="mb-10 flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          Compare our plans
        </h2>
        <p className="max-w-2xl text-sm text-gray-400 md:text-base">
          Start with the basics, then upgrade when you want more automation and
          more connected accounts.
        </p>
      </div>

      {/* Sticky header (pricing cards) */}
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Left spacer / description (NOT sticky) */}
        <div className="hidden lg:block">
          <div
            className={[
              "rounded-3xl border border-white/10 bg-white/3 backdrop-blur-md transition-all duration-500 ease-in-out",
              isCompact ? "p-5 opacity-80" : "p-8",
            ].join(" ")}
          >
            <div className="text-sm font-medium text-white/80">Included</div>
            <div
              className={[
                "mt-2 font-semibold text-white transition-all duration-500 ease-in-out",
                isCompact ? "text-xl" : "text-2xl",
              ].join(" ")}
            >
              Everything you need to demo the platform
            </div>
            <div className="mt-3 text-sm text-white/60">
              Same experience for every visitor. Once you connect an account,
              this will switch to real broker data.
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="flex h-10 items-center justify-center rounded-xl border border-white/15 bg-transparent px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 hover:text-white"
              >
                Try it out
              </Link>
            </div>
          </div>
        </div>

        {/* Basic + Pro (single glass panel) - sticky */}
        <div
          className={[
            "z-30 lg:col-span-2",
            "sticky self-start",
            "transition-[padding,transform,filter] duration-500 ease-in-out",
            isCompact ? "py-2" : "py-0",
          ].join(" ")}
          style={{ top: stickyTop }}
        >
          <div className="rounded-3xl border border-white/12 bg-white/4 backdrop-blur-md">
            <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {/* Basic */}
              <div
                className={[
                  "transition-[padding] duration-500 ease-in-out",
                  isCompact ? "p-5" : "p-8",
                ].join(" ")}
              >
                <div className="text-base font-semibold text-white">Free</div>
                <motion.div
                  layout
                  className="mt-2 overflow-hidden text-sm text-white/60"
                  animate={{
                    opacity: isCompact ? 0 : 1,
                    maxHeight: isCompact ? 0 : 40,
                    y: isCompact ? -4 : 0,
                  }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  For more basic traders.
                </motion.div>

                <motion.div
                  layout
                  className={isCompact ? "mt-3 flex items-center justify-between gap-3" : "mt-4"}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div
                    layout
                    className={isCompact ? "text-2xl font-bold text-white" : "flex items-end gap-2"}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.div
                      layout
                      className={isCompact ? "text-2xl font-bold text-white" : "text-4xl font-bold text-white"}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {freePrice}
                    </motion.div>
                    <motion.div
                      layout
                      className="pb-1 text-sm text-white/50"
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
                    <Button
                      borderRadius="2rem"
                      containerClassName="w-full"
                      className="bg-white p-2 flex gap-2 dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800"
                    >
                      <span className="w-full font-bold">Get Started</span>
                      <span
                        className={cn(
                          "flex items-center justify-center rounded-full bg-black text-white",
                          isCompact ? "min-h-7 min-w-7" : "min-h-8 min-w-8",
                        )}
                      >
                        <ArrowRight className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                      </span>
                    </Button>
                  </motion.div>
                </motion.div>
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
                    <div className="text-base font-semibold text-white">Standard</div>
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
                      Most popular
                    </motion.div>
                  </div>

                  <motion.div
                    layout
                    className="mt-2 overflow-hidden text-sm text-white/60"
                    animate={{
                      opacity: isCompact ? 0 : 1,
                      maxHeight: isCompact ? 0 : 40,
                      y: isCompact ? -4 : 0,
                    }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    For more advanced traders.
                  </motion.div>

                  <motion.div
                    layout
                    className={isCompact ? "mt-3 flex items-center justify-between gap-3" : "mt-4"}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.div
                      layout
                      className={isCompact ? "text-2xl font-bold text-white" : "flex items-end gap-2"}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.div
                        layout
                        className={isCompact ? "text-2xl font-bold text-white" : "text-4xl font-bold text-white"}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {standardPrice}
                      </motion.div>
                      <motion.div
                        layout
                        className="pb-1 text-sm text-white/50"
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
                      <Button
                        borderRadius="2rem"
                        containerClassName="w-full"
                        className="bg-white p-2 dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800"
                      >
                        <span className="w-full font-bold">Get Started</span>
                        <span
                          className={cn(
                            "flex items-center justify-center rounded-full bg-black text-white",
                            isCompact ? "min-h-7 min-w-7" : "min-h-8 min-w-8",
                          )}
                        >
                          <ArrowRight className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                        </span>
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Comparison table (div-based) */}
        <div className="lg:col-span-3">
          {/* Sentinel: used to trigger compact mode once the table reaches the sticky header */}
          <div ref={tableStartRef} className="h-px w-full" aria-hidden="true" />
          <div className="mt-2 overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-md">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="hidden border-b border-white/10 px-6 py-5 text-sm font-medium text-white/70 lg:block">
                Features
              </div>
              <div className="hidden border-b border-white/10 px-6 py-5 text-sm font-medium text-white/70 lg:block">
                Free
              </div>
              <div className="hidden border-b border-white/10 px-6 py-5 text-sm font-medium text-white/70 lg:block">
                Standard
              </div>

              {features.map((row) => (
                <React.Fragment key={row.label}>
                  <div className="border-b border-white/10 px-6 py-5 text-sm text-white/70">
                    {row.label}
                  </div>
                  <div className="border-b border-white/10 px-6 py-5">
                    <div className="flex items-center justify-start">
                      {row.basic}
                    </div>
                  </div>
                  <div className="border-b border-white/10 px-6 py-5">
                    <div className="flex items-center justify-start">
                      {row.pro}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
