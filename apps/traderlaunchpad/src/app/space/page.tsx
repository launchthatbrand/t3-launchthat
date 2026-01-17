"use client";

import {
  Activity,
  AlertTriangle,
  BarChart2,
  Calendar as CalendarIcon,
  Crosshair,
  Globe,
  LayoutGrid,
  MessageSquare,
  Power,
  Settings,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  demoDashboardStats as untypedDemoDashboardStats,
  demoInsights as untypedDemoInsights,
} from "@acme/demo-data";

import { DottedGlowBackground } from "@acme/ui";
import { cn } from "@acme/ui";

// Explicitly typing the mock data to bypass linting issues in this experimental page
const demoDashboardStats = untypedDemoDashboardStats as {
  balance: number;
  winRate: number;
  profitFactor: number;
  streak: number;
};

const demoInsights = untypedDemoInsights as {
  icon: "trendingUp" | "alertCircle" | "calendar";
  title: string;
  description: string;
}[];

// --- Cockpit UI Components ---

function CockpitFrame() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {/* Physical Window Frame (The "Ship") */}
      <div className="absolute inset-0">
        {/* Top/Bottom Letterbox bars simulating window frame */}
        <div className="absolute top-0 right-0 left-0 h-8 border-b border-slate-800 bg-slate-950/90 shadow-2xl" />
        <div className="absolute right-0 bottom-0 left-0 h-8 border-t border-slate-800 bg-slate-950/90 shadow-2xl" />

        {/* Angled Corners (SVG) simulating structural supports */}
        <svg
          className="absolute inset-0 h-full w-full text-slate-950/90"
          preserveAspectRatio="none"
        >
          {/* Top Left Corner */}
          <path d="M0 0 L120 0 L0 120 Z" fill="currentColor" />
          {/* Top Right Corner */}
          <path
            d="M100% 0 L100% 120 Lcalc(100% - 120px) 0 Z"
            fill="currentColor"
          />
          {/* Bottom Left Corner */}
          <path
            d="M0 100% L120 100% L0 calc(100% - 120px) Z"
            fill="currentColor"
          />
          {/* Bottom Right Corner */}
          <path
            d="M100% 100% Lcalc(100% - 120px) 100% L100% calc(100% - 120px) Z"
            fill="currentColor"
          />
        </svg>

        {/* Structural Borders / Rivets */}
        <div className="absolute top-8 bottom-8 left-0 w-4 border-r border-slate-800 bg-slate-950/50" />
        <div className="absolute top-8 right-0 bottom-8 w-4 border-l border-slate-800 bg-slate-950/50" />
      </div>

      {/* Glass Reflection / Glare on the window */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-cyan-500/5 via-transparent to-blue-500/5 opacity-30 mix-blend-overlay" />

      {/* HUD Overlay Elements projected on the glass */}
      {/* Top Bar HUD */}
      <div className="absolute top-2 right-12 left-12 flex h-12 items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 animate-pulse text-cyan-400" />
          <span className="font-mono text-xs tracking-[0.2em] text-cyan-400 uppercase">
            Orbital Command // TLP-01
          </span>
        </div>

        {/* Center decorative HUD element */}
        <div className="h-px w-32 bg-linear-to-r from-transparent via-cyan-500/50 to-transparent" />

        <div className="flex items-center gap-4 font-mono text-xs text-cyan-600">
          <span className="animate-pulse">SYS: ONLINE</span>
          <span>NET: SECURE</span>
          <span className="text-emerald-500">LINK: 100%</span>
        </div>
      </div>

      {/* Corner Brackets (HUD) */}
      <svg className="absolute top-12 left-8 h-24 w-24 text-cyan-500/40 opacity-60">
        <path
          d="M2 30 V2 H30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M2 2 L12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <svg className="absolute top-12 right-8 h-24 w-24 text-cyan-500/40 opacity-60">
        <path
          d="Mcalc(100% - 30px) 2 Hcalc(100% - 2px) V30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="Mcalc(100% - 2px) 2 Lcalc(100% - 12px) 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <svg className="absolute bottom-12 left-8 h-24 w-24 text-cyan-500/40 opacity-60">
        <path
          d="M2 calc(100% - 30px) Vcalc(100% - 2px) H30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M2 calc(100% - 2px) L12 calc(100% - 12px)"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <svg className="absolute right-8 bottom-12 h-24 w-24 text-cyan-500/40 opacity-60">
        <path
          d="Mcalc(100% - 30px) calc(100% - 2px) Hcalc(100% - 2px) Vcalc(100% - 30px)"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="Mcalc(100% - 2px) calc(100% - 2px) Lcalc(100% - 12px) calc(100% - 12px)"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      {/* Vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
}

function StarField() {
  return (
    <div className="fixed inset-0 z-0 bg-black">
      {/* "Space UI" behind the glass: same flickering dotted glow vibe as homepage */}
      <DottedGlowBackground
        color="rgba(34, 211, 238, 0.14)" // cyan-400-ish
        glowColor="rgba(34, 211, 238, 0.55)"
        gap={24}
        radius={1.6}
        speedMin={0.2}
        speedMax={0.9}
      />

      {/* Cyan ambient glows */}
      <div className="absolute top-1/3 left-1/4 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/18 blur-[140px]" />
      <div className="absolute right-0 bottom-0 h-[680px] w-[680px] translate-x-1/3 translate-y-1/3 rounded-full bg-sky-500/12 blur-[160px]" />

      {/* Subtle perspective grid */}
      <div className="pointer-events-none absolute inset-0 opacity-35 mask-[radial-gradient(ellipse_at_center,rgba(0,0,0,1)_40%,rgba(0,0,0,0)_80%)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-size-[44px_44px]" />
        <div className="absolute inset-0 transform-[perspective(900px)_rotateX(55deg)_translateY(180px)_scale(1.25)] origin-[50%_100%] opacity-70">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.10)_1px,transparent_1px)] bg-size-[44px_44px]" />
        </div>
      </div>

      {/* Cockpit frame overlay PNG with true transparent windows */}
      <img
        src="/images/cockpit-frame-overlay-alpha.png"
        alt="Cockpit Frame Overlay"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-95"
      />

      {/* Glass glare/reflections on the canopy */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-cyan-500/7 via-transparent to-white/6 opacity-45 mix-blend-overlay" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_40%),radial-gradient(circle_at_70%_10%,rgba(56,189,248,0.10),transparent_45%)]" />

      {/* Vignette / depth */}
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-transparent to-black/70" />
    </div>
  );
}

function HolographicCard({
  children,
  className,
  title,
  icon: Icon,
  glowing = false,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ElementType;
  glowing?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-slate-950/40 p-4 backdrop-blur-md transition-all duration-300",
        glowing
          ? "border-cyan-500/40 shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]"
          : "border-slate-800/60 shadow-lg hover:border-slate-700",
        className,
      )}
    >
      {/* Scanline Effect */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,255,247,0.03)_1px,transparent_1px)] bg-size-[100%_4px] opacity-20" />

      {/* Header */}
      {(title ?? Icon) && (
        <div className="relative z-10 mb-4 flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2 text-cyan-400">
            {Icon && <Icon className="h-4 w-4" />}
            {title && (
              <h3 className="font-mono text-xs font-bold tracking-wider uppercase">
                {title}
              </h3>
            )}
          </div>
          <div className="flex gap-1">
            <div className="h-1 w-1 bg-cyan-500/50" />
            <div className="h-1 w-1 bg-cyan-500/30" />
            <div className="h-1 w-1 bg-cyan-500/10" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-slate-200">{children}</div>
    </div>
  );
}

function SystemNav() {
  const navItems = [
    { icon: LayoutGrid, label: "DECK", active: true },
    { icon: BarChart2, label: "LOGS" },
    { icon: CalendarIcon, label: "PLAN" },
    { icon: MessageSquare, label: "COMMS" },
    { icon: Settings, label: "CFG" },
  ];

  return (
    <nav className="fixed top-24 left-6 z-40 flex flex-col gap-4">
      {navItems.map((item) => (
        <button
          key={item.label}
          className={cn(
            "group flex items-center gap-3 rounded-l-sm border-r-2 bg-linear-to-l px-4 py-3 font-mono text-xs transition-all",
            item.active
              ? "border-cyan-500 from-cyan-950/40 to-transparent text-cyan-400"
              : "border-transparent text-slate-500 hover:border-slate-700 hover:text-slate-300",
          )}
        >
          <item.icon
            className={cn(
              "h-5 w-5",
              item.active && "drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]",
            )}
          />
          <span className="hidden opacity-0 transition-opacity duration-300 lg:block lg:group-hover:opacity-100">
            {item.label}
          </span>
        </button>
      ))}

      <button className="mt-8 flex items-center gap-3 px-4 py-3 text-red-500/70 transition-colors hover:text-red-400">
        <Power className="h-5 w-5" />
      </button>
    </nav>
  );
}

// --- Metrics Components ---

function EngineReadout({
  label,
  value,
  subtext,
  trend,
}: {
  label: string;
  value: string;
  subtext: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[10px] text-slate-500 uppercase">
        {label}
      </div>
      <div className="font-mono text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
        {value}
      </div>
      <div className="flex items-center gap-2">
        {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-400" />}
        <span className="text-xs text-slate-400">{subtext}</span>
      </div>
    </div>
  );
}

function CircularGauge({
  value,
  color = "cyan",
}: {
  value: number;
  color?: string;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg className="h-full w-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="stroke-slate-800"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          className={cn(
            "stroke-current transition-all duration-1000 ease-out",
            color === "cyan" ? "text-cyan-500" : "text-emerald-500",
          )}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute font-mono text-sm font-bold text-white">
        {value}%
      </div>
    </div>
  );
}

// --- Main Page ---

export default function SpaceCockpitPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-black text-slate-200 selection:bg-cyan-500/30">
      <StarField />
      <CockpitFrame />
      <SystemNav />

      {/* Main Content Area */}
      <main className="relative z-10 ml-20 p-8 pt-20 lg:ml-24">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                Command Deck
              </h1>
              <p className="mt-1 font-mono text-sm text-cyan-500/70">
                PILOT: TRADER_ONE // STATUS: ACTIVE
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-mono text-xs text-slate-500">
                  CURRENT TIME
                </div>
                <div className="font-mono text-xl font-bold text-white">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <HolographicCard title="Account Balance" icon={Shield} glowing>
              <EngineReadout
                label="Total Funds"
                value={`$${demoDashboardStats.balance.toLocaleString()}`}
                subtext="+12.5% this cycle"
                trend="up"
              />
              <div className="mt-4 h-1 w-full overflow-hidden bg-slate-800">
                <div className="h-full w-[70%] animate-pulse bg-cyan-500" />
              </div>
            </HolographicCard>

            <HolographicCard title="Win Rate" icon={Crosshair}>
              <div className="flex items-center justify-between">
                <EngineReadout
                  label="Efficiency"
                  value={`${demoDashboardStats.winRate}%`}
                  subtext="Last 30 days"
                />
                <CircularGauge
                  value={demoDashboardStats.winRate}
                  color="emerald"
                />
              </div>
            </HolographicCard>

            <HolographicCard title="Profit Factor" icon={Activity}>
              <div className="flex items-center justify-between">
                <EngineReadout
                  label="Risk/Reward"
                  value={demoDashboardStats.profitFactor.toString()}
                  subtext="Optimal range"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 shadow-inner">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </HolographicCard>

            <HolographicCard title="Active Streak" icon={Zap}>
              <div className="flex items-end gap-2">
                <span className="font-mono text-4xl font-bold text-white">
                  {demoDashboardStats.streak}
                </span>
                <span className="mb-1 font-mono text-xs text-slate-400">
                  DAYS
                </span>
              </div>
              <div className="mt-4 flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-sm",
                      i <= demoDashboardStats.streak
                        ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        : "bg-slate-800",
                    )}
                  />
                ))}
              </div>
            </HolographicCard>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Chart Area */}
            <div className="lg:col-span-2">
              <HolographicCard
                className="h-full min-h-[400px]"
                title="Trajectory Analysis"
                icon={TrendingUp}
              >
                <div className="relative h-full w-full">
                  {/* Fake Grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[40px_40px]" />

                  {/* Placeholder Chart Content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Activity className="mx-auto h-16 w-16 text-cyan-500/20" />
                      <p className="mt-4 font-mono text-xs text-cyan-500/40">
                        NO SIGNAL DETECTED
                      </p>
                    </div>
                  </div>
                </div>
              </HolographicCard>
            </div>

            {/* Side Panel / Insights */}
            <div className="space-y-6">
              <HolographicCard title="Mission Status" icon={BarChart2}>
                <div className="space-y-4">
                  {demoInsights.map((insight, i) => (
                    <div
                      key={i}
                      className="group flex items-start gap-3 rounded-md border border-transparent p-2 transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/5"
                    >
                      <div className="mt-0.5 rounded-full bg-slate-800 p-1.5 text-cyan-400 group-hover:text-cyan-300">
                        {insight.icon === "trendingUp" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : insight.icon === "alertCircle" ? (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        ) : (
                          <CalendarIcon className="h-3 w-3" />
                        )}
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold text-slate-200">
                          {insight.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {insight.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </HolographicCard>

              <HolographicCard title="System Alerts" icon={AlertTriangle}>
                <div className="flex items-center gap-3 rounded border border-amber-900/30 bg-amber-500/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <div className="font-mono text-xs font-bold text-amber-400">
                      WARNING: HIGH VOLATILITY
                    </div>
                    <div className="text-[10px] text-amber-500/70">
                      Sector 7 (Crypto) showing erratic behavior.
                    </div>
                  </div>
                </div>
              </HolographicCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
