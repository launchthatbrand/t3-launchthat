import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  Bitcoin,
  Cpu,
  Globe,
  Layers,
  Lock,
  MessageSquare,
  Sparkles,
  Webhook,
  Zap,
} from "lucide-react";

import { DottedGlowBackground, OrbitingCircles } from "@acme/ui";
import { Button } from "@acme/ui/button";

import { Header } from "../components/landing/Header";

const GridLines = () => (
  <div className="pointer-events-none absolute inset-0 z-0 mx-auto h-full max-w-7xl">
    <div className="absolute top-0 left-4 h-full w-px bg-white/5" />
    <div className="absolute top-0 right-4 h-full w-px bg-white/5" />
    <div className="absolute top-0 left-1/4 hidden h-full w-px bg-white/5 md:block" />
    <div className="absolute top-0 left-2/4 hidden h-full w-px bg-white/5 md:block" />
    <div className="absolute top-0 left-3/4 hidden h-full w-px bg-white/5 md:block" />
  </div>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M6 0V12M0 6H12" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
  </svg>
);

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white selection:bg-orange-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <DottedGlowBackground
          color="rgba(255, 100, 0, 0.15)"
          glowColor="rgba(255, 120, 0, 0.6)"
          gap={24}
          radius={1.5}
          speedMin={0.2}
          speedMax={0.8}
        />
        {/* Large orange glow blobs */}
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/20 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-orange-500/10 blur-[120px]" />

        {/* Architectural Curve - Large S-Curve */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
          preserveAspectRatio="none"
        >
          <path
            d="M-100,0 C200,400 600,0 1200,800 S1800,400 2200,1200"
            fill="none"
            stroke="url(#curveGradient)"
            strokeWidth="1"
          />
          <defs>
            <linearGradient
              id="curveGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(249,115,22,0.5)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <Header />

      <main className="relative z-10 pt-32">
        <GridLines />

        {/* Hero Section */}
        <section className="relative container mx-auto max-w-7xl px-4 text-center">
          <div className="mx-auto mb-8 w-fit rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-200 backdrop-blur-sm">
            Innovative Web3 Solutions
          </div>

          <h1 className="mx-auto max-w-5xl text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl">
            Empowering Your <br className="hidden md:block" />
            Investments With AI <br className="hidden md:block" />
            <span className="bg-linear-to-r from-white via-orange-100 to-orange-400 bg-clip-text text-transparent">
              Technology
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg text-gray-400 md:text-xl">
            Our innovative AI technology transforms asset management by
            analyzing vast data sets in real-time.
          </p>

          <div className="mt-10 flex justify-center">
            <Button
              asChild
              className="h-12 rounded-full bg-white px-8 text-base font-medium text-black transition-transform hover:scale-105 hover:bg-gray-100"
            >
              <Link href="/sign-up">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Horizontal Line with Plus Icons */}
          <div className="absolute right-0 bottom-0 left-0 hidden w-full translate-y-32 items-center justify-center md:flex">
            <div className="relative mx-auto h-px w-full max-w-7xl bg-white/5">
              <PlusIcon className="absolute left-4 -translate-x-1/2 -translate-y-1/2" />
              <PlusIcon className="absolute left-1/4 -translate-x-1/2 -translate-y-1/2" />
              <PlusIcon className="absolute left-2/4 -translate-x-1/2 -translate-y-1/2" />
              <PlusIcon className="absolute left-3/4 -translate-x-1/2 -translate-y-1/2" />
              <PlusIcon className="absolute right-4 translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </section>

        {/* Logo Ticker */}
        <section className="relative container mx-auto mt-20 max-w-7xl px-4 md:mt-32">
          <p className="mb-8 text-center text-sm font-medium text-gray-500">
            Trusted by top innovative teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0 md:gap-16">
            {["Healthro", "Finyon", "Aegra", "Portvio", "Vaultic"].map(
              (name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 text-lg font-bold text-white"
                >
                  <div className="h-6 w-6 rounded bg-linear-to-br from-gray-700 to-gray-900" />
                  {name}
                </div>
              ),
            )}
          </div>

          {/* Horizontal Line below logos */}
          <div className="absolute right-0 -bottom-16 left-0 hidden w-full items-center justify-center md:flex">
            <div className="relative mx-auto h-px w-full max-w-7xl bg-white/5">
              <PlusIcon className="absolute left-4 -translate-x-1/2 -translate-y-1/2" />
              <PlusIcon className="absolute right-4 translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="relative container mx-auto mt-24 mb-24 max-w-7xl px-4 md:mt-32">
          {/* Top Split Section */}
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            {/* Left: Toggle Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6 md:p-12">
              <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6">
                <div className="relative h-16 w-64 rounded-full bg-orange-950/30 p-1 shadow-inner ring-1 ring-white/10">
                  <div className="absolute top-1 left-1 h-14 w-32 rounded-full bg-linear-to-r from-orange-600 to-orange-500 shadow-lg shadow-orange-500/20 transition-all">
                    <div className="flex h-full w-full items-center justify-center">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-1 right-1 flex h-14 w-32 items-center justify-center">
                    <Globe className="h-6 w-6 text-orange-500/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Text Content */}
            <div className="flex flex-col justify-center rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-sm md:p-12">
              <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                Easier & Smarter
              </h2>
              <p className="mt-4 text-gray-400">
                This allows us to identify investment opportunities that
                maximize returns for our clients.
              </p>
              <div className="mt-8">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/sign-up">
                    Get started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-24 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
              Invest With Confidence.
              <br />
              Backed By Intelligence.
            </h2>
          </div>

          {/* Bottom Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Large Card: Precision Growth */}
            <div className="col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6 md:col-span-2">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Precision-Driven Portfolio Growth
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  Every move guided by data and insights for smarter portfolio
                  growth.
                </p>
              </div>

              <div className="relative mt-8 h-48 w-full">
                {/* Mock Chart Area */}
                <svg
                  className="h-full w-full"
                  viewBox="0 0 400 150"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="chartGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Line */}
                  <path
                    d="M0,130 C40,120 80,110 120,90 C160,70 200,80 240,50 C280,20 320,40 360,20 L400,10"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Area */}
                  <path
                    d="M0,130 C40,120 80,110 120,90 C160,70 200,80 240,50 C280,20 320,40 360,20 L400,10 V150 H0 Z"
                    fill="url(#chartGradient)"
                    className="opacity-50"
                  />
                  {/* Highlight Point */}
                  <circle cx="240" cy="50" r="4" fill="white" />
                  <circle
                    cx="240"
                    cy="50"
                    r="8"
                    stroke="white"
                    strokeOpacity="0.3"
                    fill="none"
                  />
                  <line
                    x1="240"
                    y1="50"
                    x2="240"
                    y2="150"
                    stroke="white"
                    strokeOpacity="0.1"
                    strokeDasharray="4 4"
                  />
                </svg>
              </div>
            </div>

            {/* Small Card: Diversified Assets */}
            <div className="col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6">
              <h3 className="text-xl font-semibold text-white">
                Diversified Assets
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Tailor your portfolio to achieve optimal performance.
              </p>

              <div className="mt-8 grid grid-cols-6 gap-2">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 w-3 rounded-full ${
                      [3, 7, 12, 18, 22].includes(i)
                        ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                        : "bg-gray-800"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Small Card: Maximize Returns (Bolt) */}
            <div className="group col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Integrations
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  Connect your stack and automate the flow: Discord alerts,
                  webhooks, TradeLocker sync, and Binance.
                </p>
              </div>
              <div className="relative mt-6 flex items-center justify-center py-4">
                <div className="relative h-56 w-full">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-black/40 shadow-[0_0_24px_rgba(249,115,22,0.25)] backdrop-blur-md">
                      <div className="absolute inset-0 rounded-full bg-orange-500/10 blur-xl" />
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.45)]">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Outer orbit */}
                  <div className="absolute inset-0">
                    <OrbitingCircles
                      radius={110}
                      duration={22}
                      iconSize={44}
                      speed={1}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md">
                        <MessageSquare className="h-5 w-5 text-white/90" />
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md">
                        <Webhook className="h-5 w-5 text-white/90" />
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md">
                        <Lock className="h-5 w-5 text-orange-300" />
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md">
                        <Bitcoin className="h-5 w-5 text-orange-300" />
                      </div>
                    </OrbitingCircles>

                    <OrbitingCircles
                      radius={62}
                      duration={16}
                      iconSize={40}
                      speed={1}
                      reverse
                      path={true}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md">
                        <MessageSquare className="h-5 w-5 text-white/80" />
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md">
                        <Webhook className="h-5 w-5 text-white/80" />
                      </div>
                    </OrbitingCircles>
                  </div>
                </div>
              </div>
            </div>

            {/* Medium Card: Portfolio Optimized */}
            <div className="col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6 md:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-6 md:mb-0 md:max-w-xs">
                  <h3 className="text-xl font-semibold text-white">
                    Your Portfolio, Optimized In Real-Time
                  </h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Adjusted instantly with market changes to enhance investment
                    efficiency.
                  </p>
                </div>

                <div className="relative flex h-48 w-full flex-1 items-center justify-center">
                  {/* Mock Radar/Pie UI */}
                  <div className="relative h-40 w-40">
                    {/* Rings */}
                    <div className="absolute inset-0 rounded-full border border-white/5" />
                    <div className="absolute inset-4 rounded-full border border-white/5" />
                    <div className="absolute inset-8 rounded-full border border-white/5" />

                    {/* Gradient Pie */}
                    <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,#f97316_120deg,transparent_120deg)] opacity-20" />

                    {/* Nodes */}
                    <div className="absolute -top-2 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 p-1.5 backdrop-blur-md">
                      <BarChart2 className="h-full w-full text-orange-400" />
                    </div>
                    <div className="absolute right-0 bottom-4 h-8 w-8 rounded-full border border-white/10 bg-black/50 p-1.5 backdrop-blur-md">
                      <Layers className="h-full w-full text-white" />
                    </div>
                    <div className="absolute bottom-4 left-0 h-8 w-8 rounded-full border border-white/10 bg-black/50 p-1.5 backdrop-blur-md">
                      <Cpu className="h-full w-full text-white" />
                    </div>

                    {/* Center Core */}
                    <div className="absolute top-1/2 left-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Minimal */}
        <footer className="border-t border-white/5 bg-black/40 py-12 backdrop-blur-sm">
          <div className="container mx-auto max-w-7xl px-4 text-center">
            <div className="mb-8 flex items-center justify-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-xs font-bold text-black">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">
                TraderLaunchpad
              </span>
            </div>
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <Link href="#" className="hover:text-white">
                Privacy
              </Link>
              <Link href="#" className="hover:text-white">
                Terms
              </Link>
              <Link href="#" className="hover:text-white">
                Contact
              </Link>
            </div>
            <p className="mt-8 text-xs text-gray-600">
              © {new Date().getFullYear()} TraderLaunchpad. All rights
              reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
