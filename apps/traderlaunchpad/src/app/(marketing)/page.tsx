import {
  ArrowRight,
  BarChart3,
  Globe,
  MessageSquare,
  Sparkles,
  User,
  Users,
  Webhook,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  ContainerScroll,
  FlipWords,
  OrbitingCircles,
  Safari,
  TextGenerateEffect,
} from "@acme/ui";
import { demoBrokers, demoPropFirms, demoPublicProfiles } from "@acme/demo-data";

import { BrokersPlatformsHoverAnimation } from "../../components/landing/BrokersPlatformsHoverAnimation";
import { Button } from "@acme/ui/moving-border";
import { GlassTitle } from "../../components/landing/GlassTitle";
import { IphoneInteractiveHint } from "../../components/landing/IphoneInteractiveHint";
import { IphoneNotificationDemo } from "../../components/landing/IphoneNotificationDemo";
import { JournalAnalyticsAnimation } from "../../components/landing/JournalAnalyticsAnimation";
import Link from "next/link";
import { Marquee } from "@acme/ui/marquee";
import { PricingSection } from "../../components/landing/PricingSection";
import React from "react";
import { SpinningSphere } from "~/components/landing/SpinningSphere";
import { StrategyBuilderAnimation } from "../../components/landing/StrategyBuilderAnimation";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";

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

export default async function HomePage() {
  const { userId } = await auth();
  const primaryCtaHref = userId ? "/admin/dashboard" : "/sign-in";
  const primaryCtaLabel = userId ? "Dashboard" : "Get Started";

  const headerList = await headers();
  const userAgent = headerList.get("user-agent") ?? "";
  const isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

  const publicProfiles = demoPublicProfiles as unknown as {
    id: string;
    username: string;
    avatarUrl?: string;
    headline?: string;
  }[];

  interface AffiliateTeaserItem {
    id: string;
    name: string;
    logoUrl?: string;
    rating: number;
  }
  const brokers = demoBrokers as unknown as AffiliateTeaserItem[];
  const firms = demoPropFirms as unknown as AffiliateTeaserItem[];
  const _topBrokers = [...brokers]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);
  const _topFirms = [...firms].sort((a, b) => b.rating - a.rating).slice(0, 10);

  return (
    <div className="relative min-h-screen text-white selection:bg-orange-500/30">
      <main className="relative z-10 pt-10">

        {/* Hero Section */}
        <section className="relative container mx-auto max-w-7xl px-4 text-center">
          {isMobileUa ? (
            <>
              {/* Mobile: keep it light (no canvas + no heavy text/scroll animations) */}
              <div className="mx-auto w-fit rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-200 backdrop-blur-sm">
                Free Trading Journal and AI Powered Analytics
              </div>
              <h1 className="mx-auto max-w-5xl text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl">
                <span className="block leading-none">
                  {/* <GlassTitle
                    text="Mission Control"
                    className="h-[2.05em] -mb-8 w-auto max-w-full align-middle"
                  /> */}
                  Mission Control
                </span>
                <div className="mx-auto mt-2 mb-2 flex items-center justify-center gap-4 md:mt-4 md:mb-4">
                  <div className="h-px w-12 bg-linear-to-r from-transparent to-white/30 md:w-24" />
                  <span className="relative font-mono text-xs font-medium tracking-[0.5em] text-white/50 md:text-sm">
                    FOR
                  </span>
                  <div className="h-px w-12 bg-linear-to-l from-transparent to-white/30 md:w-24" />
                </div>
                <span className="block leading-none">Trading Communities</span>
              </h1>

              <p className="mx-auto mt-8 max-w-2xl text-lg font-medium text-center text-gray-400 md:text-xl">
                Turn trades into a plan—AI insights, reminders, and
                broker-connected analytics so you trade with confidence.
              </p>

              <div className="mt-20 mb-20 flex justify-center">
                <Link href={primaryCtaHref} className="inline-block">
                  <Button
                    as="div"
                    borderRadius="1.75rem"
                    containerClassName="h-14 w-auto min-w-[200px]"
                    className="bg-white text-black text-lg font-bold border-neutral-200 dark:border-slate-800 transition-transform hover:scale-105 cursor-pointer"
                  >
                    <span className="flex w-full items-center justify-between gap-4 px-2">
                      <span className="w-full">{primaryCtaLabel}</span>
                      <span className="flex min-h-8 min-w-8 items-center justify-center rounded-full bg-black text-white">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </span>
                  </Button>
                </Link>
              </div>

              <Safari
                url="traderlaunchpad.com/admin"
                imageSrc="/images/traderlaunchpad-backend.jpg"
                className=""
              />
            </>
          ) : (
            <>
              <div
                className="pointer-events-none absolute top-0 right-0 z-0 opacity-70 blur-[0.2px]"
                style={{
                  width: "clamp(180px, 28vw, 420px)",
                  height: "clamp(180px, 28vw, 420px)",
                  transform: "translate(18%, -18%)",
                }}
              >
                <SpinningSphere />
              </div>

              <ContainerScroll
                titleComponent={
                  <>
                    <div className="mx-auto w-fit rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-200 backdrop-blur-sm">
                      Free Trading Journal and AI Powered Analytics
                    </div>
                    <h1 className="mx-auto max-w-5xl text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl">
                      <span className="block leading-none">
                        {/* <GlassTitle
                          text="Mission Control"
                          className="h-[2.05em] -mb-8 w-auto max-w-full align-middle"
                        /> */}
                        Mission Control
                      </span>
                      <div className="mx-auto mt-2 mb-2 flex items-center justify-center gap-4 md:mt-4 md:mb-4">
                        <div className="h-px w-12 bg-linear-to-r from-transparent to-white/30 md:w-24" />
                        <span className="relative font-mono text-xs font-medium tracking-[0.5em] text-white/50 md:text-sm">
                          FOR
                        </span>
                        <div className="h-px w-12 bg-linear-to-l from-transparent to-white/30 md:w-24" />
                      </div>
                      <span className="block leading-none">
                        <FlipWords
                          words={[
                            "Trading Groups",
                            "Market Analytics",
                            "Data-Driven Traders",
                          ]}
                          duration={4000}
                          className="block px-0 text-center leading-none"
                          wordClassName="font-bold tracking-tight"
                          letterClassName="text-white"
                        />
                      </span>
                    </h1>

                    <TextGenerateEffect
                      words="Turn trades into a plan—AI insights, reminders, and broker-connected analytics so you trade with confidence."
                      className="mx-auto mt-8 max-w-2xl"
                      textClassName="mt-0 text-lg font-medium text-center text-gray-400 md:text-xl"
                      wordClassName="text-gray-400"
                      duration={0.6}
                    />

                    <div className="mt-20 mb-20 flex justify-center">
                      <Link href={primaryCtaHref} className="inline-block">
                        <Button
                          as="div"
                          borderRadius="1.75rem"
                          containerClassName="h-14 w-auto min-w-[200px]"
                          className="bg-white text-black text-lg font-bold border-neutral-200 dark:border-slate-800 transition-transform hover:scale-105 cursor-pointer"
                        >
                          <span className="flex w-full items-center justify-between gap-4 px-2">
                            <span className="w-full">{primaryCtaLabel}</span>
                            <span className="flex min-h-8 min-w-8 items-center justify-center rounded-full bg-black text-white">
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </span>
                        </Button>
                      </Link>
                    </div>
                  </>
                }
              >
                <div>
                  <Safari
                    url="traderlaunchpad.com/admin"
                    imageSrc="/images/traderlaunchpad-backend.jpg"
                    className=""
                  />
                </div>
              </ContainerScroll>
            </>
          )}

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
        <section className="relative container mx-auto mt-20 pt-10 max-w-7xl px-4 md:mt-32">
          <p className="mb-8 text-center text-sm font-medium text-gray-500">
            Members of the fleet
          </p>
          {isMobileUa ? (
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 opacity-90 sm:grid-cols-2 lg:grid-cols-3">
              {publicProfiles.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  href={`/u/${encodeURIComponent(p.username)}`}
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-md"
                >
                  <Avatar className="h-7 w-7 border border-white/10">
                    <AvatarImage src={p.avatarUrl} alt={p.username} />
                    <AvatarFallback className="bg-white/10 text-[11px] text-white/80">
                      {p.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{p.username}</span>
                  <span className="hidden text-[11px] text-white/55 md:inline">
                    {p.headline ?? "Public journal"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <Marquee
              pauseOnHover
              className="mx-auto max-w-5xl opacity-50 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0 [--duration:48s] [--gap:4rem]"
              repeat={3}
            >
              {publicProfiles.map((p) => (
                <Link
                  key={p.id}
                  href={`/u/${encodeURIComponent(p.username)}`}
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-md"
                >
                  <Avatar className="h-7 w-7 border border-white/10">
                    <AvatarImage src={p.avatarUrl} alt={p.username} />
                    <AvatarFallback className="bg-white/10 text-[11px] text-white/80">
                      {p.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{p.username}</span>
                  <span className="hidden text-[11px] text-white/55 md:inline">
                    {p.headline ?? "Public journal"}
                  </span>
                </Link>
              ))}
            </Marquee>
          )}

          {/* Horizontal Line below logos */}
          <div className="absolute right-0 -bottom-16 left-0 hidden w-full items-center justify-center md:flex">
            <div className="relative mx-auto h-px w-full max-w-7xl bg-white/5">
              <PlusIcon className="absolute left-4 -translate-x-1/2 -translate-y-1/2" />
              <PlusIcon className="absolute right-4 translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </section>

        {/* Affiliate directories teaser */}
        {/* <section className="relative container mx-auto mt-20 max-w-7xl px-4 md:mt-28">
          <div className="grid gap-6 md:grid-cols-2">
             // Brokers
            <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-white/6 opacity-70" />
              <div className="relative">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm">
                  Top rated brokers
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  Brokers directory
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  Curated brokers with affiliate links, ratings, and market focus.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <Link href="/brokers" className="inline-block">
                    <Button
                      as="div"
                      borderRadius="1.75rem"
                      containerClassName="h-12 w-auto min-w-[160px]"
                      className="bg-white text-black font-medium border-neutral-200 dark:border-slate-800 cursor-pointer"
                    >
                      <span className="flex w-full items-center justify-between gap-3 px-1">
                        <span className="w-full text-center font-bold">View brokers</span>
                        <span className="flex min-h-7 min-w-7 items-center justify-center rounded-full bg-black text-white">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </span>
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20 py-3 backdrop-blur-md">
                  <Marquee className="[--duration:46s] [--gap:2.25rem]" repeat={3}>
                    {topBrokers.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-3 rounded-full border border-white/10 bg-white/3 px-3 py-2 text-sm text-white/80 backdrop-blur-md"
                      >

                        <img
                          src={b.logoUrl ?? ""}
                          alt={b.name}
                          className="h-6 w-6 rounded-full border border-white/10 bg-black/30"
                        />
                        <span className="font-semibold">{b.name}</span>
                        <span className="text-xs text-white/40">
                          {b.rating.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </Marquee>
                </div>
              </div>
            </div>

            // Prop firms
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-white/6 opacity-70" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm">
              Top rated prop firms
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Prop firms directory
            </h3>
            <p className="mt-2 text-sm text-white/60">
              Compare eval styles and rules, then share affiliate links you trust.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link href="/firms" className="inline-block">
                <Button
                  as="div"
                  borderRadius="1.75rem"
                  containerClassName="h-12 w-auto min-w-[160px]"
                  className="bg-white text-black font-medium border-neutral-200 dark:border-slate-800 cursor-pointer"
                >
                  <span className="flex w-full items-center justify-between gap-3 px-1">
                    <span className="w-full text-center font-bold">View prop firms</span>
                    <span className="flex min-h-7 min-w-7 items-center justify-center rounded-full bg-black text-white">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </span>
                </Button>
              </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20 py-3 backdrop-blur-md">
              <Marquee className="[--duration:48s] [--gap:2.25rem]" repeat={3}>
                {topFirms.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-full border border-white/10 bg-white/3 px-3 py-2 text-sm text-white/80 backdrop-blur-md"
                  >

                    <img
                      src={f.logoUrl ?? ""}
                      alt={f.name}
                      className="h-6 w-6 rounded-full border border-white/10 bg-black/30"
                    />
                    <span className="font-semibold">{f.name}</span>
                    <span className="text-xs text-white/40">
                      {f.rating.toFixed(1)}
                    </span>
                  </div>
                ))}
              </Marquee>
            </div>
          </div>
        </div>
    </div>
        </section > */
        }

        <section
          id="features"
          className="relative container mx-auto mt-24 mb-24 max-w-7xl px-4 scroll-mt-24 md:mt-32"
        >
          {/* Bottom Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Large Card: Trading Plan Builder */}
            <div className="col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6 md:col-span-2">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  AI Strategy Builder + Trading Plan
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  Start from proven templates, tune risk rules, and turn your
                  journal data into a plan with clear “when to trade / when to
                  stop” guardrails.
                </p>
              </div>

              {isMobileUa ? (
                <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/70 backdrop-blur-sm">
                  Strategy builder preview (mobile-optimized).
                </div>
              ) : (
                <StrategyBuilderAnimation />
              )}
            </div>

            {/* Small Card: Broker Coverage */}
            <div className="col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6">
              <h3 className="text-xl font-semibold text-white">
                Brokers & Platforms
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Plug into your broker to pull trades, track outcomes, and power
                recommendations.
              </p>

              {isMobileUa ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60 backdrop-blur-sm">
                  Broker preview (mobile-optimized).
                </div>
              ) : (
                <BrokersPlatformsHoverAnimation />
              )}
              <div className="mt-4 text-xs text-white/50">
                + Discord alerts, webhooks, and automation events.
              </div>
            </div>

            {/* Small Card: Integrations */}
            <div className="group col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Discord + Automations
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  Pipe signals into Discord, trigger webhooks, and connect your
                  stack so your plan stays actionable.
                </p>
              </div>
              <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4">
                {/* orange corner glow + arcs */}
                <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-orange-600/35 blur-[80px]" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[conic-gradient(from_210deg,rgba(249,115,22,0.55),rgba(249,115,22,0.12)_35%,rgba(249,115,22,0)_65%,rgba(249,115,22,0.25))] opacity-70 blur-[0px]" />

                {/* rings */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-56 w-56">
                    {/* Conic gradient lanes BETWEEN ring outlines */}
                    {/* Lane 1: between outer ring (inset-0) and ring (inset-6) */}
                    <div
                      className="absolute inset-0 rounded-full opacity-70"
                      style={{
                        background:
                          "conic-gradient(from 220deg, rgba(249,115,22,0.65), rgba(249,115,22,0.18) 30%, rgba(249,115,22,0) 65%, rgba(249,115,22,0.35))",
                        WebkitMaskImage:
                          "radial-gradient(farthest-side, transparent calc(100% - 24px), #000 calc(100% - 24px), #000 100%)",
                        maskImage:
                          "radial-gradient(farthest-side, transparent calc(100% - 24px), #000 calc(100% - 24px), #000 100%)",
                      }}
                    />
                    {/* Lane 2: between ring (inset-6) and ring (inset-12) */}
                    <div
                      className="absolute inset-6 rounded-full opacity-55"
                      style={{
                        background:
                          "conic-gradient(from 205deg, rgba(249,115,22,0.55), rgba(249,115,22,0.14) 30%, rgba(249,115,22,0) 70%, rgba(249,115,22,0.25))",
                        WebkitMaskImage:
                          "radial-gradient(farthest-side, transparent calc(100% - 24px), #000 calc(100% - 24px), #000 100%)",
                        maskImage:
                          "radial-gradient(farthest-side, transparent calc(100% - 24px), #000 calc(100% - 24px), #000 100%)",
                      }}
                    />

                    {/* Crisp ring outlines (sit on top of lanes) */}
                    <div className="absolute inset-0 rounded-full border border-orange-500/25" />
                    <div className="absolute inset-6 rounded-full border border-orange-500/18" />
                    <div className="absolute inset-12 rounded-full border border-orange-500/12" />

                    {/* Subtle dashed HUD ring */}
                    <div className="absolute inset-9 rounded-full border border-orange-500/10 border-dashed opacity-60" />
                  </div>
                </div>

                <div className="relative h-56 w-full">
                  {/* center core */}
                  {isMobileUa ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 shadow-[0_0_30px_rgba(249,115,22,0.45)]">
                        <span className="text-xs font-semibold text-white">TLP</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 shadow-[0_0_30px_rgba(249,115,22,0.45)]">
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      {/* Orbiting chips */}
                      <div className="absolute inset-0">
                        <OrbitingCircles radius={112} duration={24} iconSize={44} speed={1}>
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_14px_30px_rgba(0,0,0,0.35)] ring-1 ring-black/10">
                            <MessageSquare className="h-5 w-5 text-black/70" />
                          </div>
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_14px_30px_rgba(0,0,0,0.35)] ring-1 ring-black/10">
                            <Users className="h-5 w-5 text-black/70" />
                          </div>
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_14px_30px_rgba(0,0,0,0.35)] ring-1 ring-black/10">
                            <BarChart3 className="h-5 w-5 text-black/70" />
                          </div>
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_14px_30px_rgba(0,0,0,0.35)] ring-1 ring-black/10">
                            <Globe className="h-5 w-5 text-black/70" />
                          </div>
                        </OrbitingCircles>

                        <OrbitingCircles
                          radius={64}
                          duration={18}
                          iconSize={40}
                          speed={1}
                          reverse
                          path={true}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_12px_24px_rgba(0,0,0,0.35)] ring-1 ring-black/10">
                            <Webhook className="h-5 w-5 text-black/70" />
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_12px_24px_rgba(0,0,0,0.35)] ring-1 ring-black/10">
                            <User className="h-5 w-5 text-black/70" />
                          </div>
                        </OrbitingCircles>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Medium Card: Journal Analytics */}
            <div className="col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6 md:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-6 md:mb-0 md:max-w-xs">
                  <h3 className="text-xl font-semibold text-white">
                    Journal Analytics that drive decisions
                  </h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Win rate, profit factor, and edge days—automatically derived
                    from your trades to guide your plan.
                  </p>
                </div>
              </div>

              {isMobileUa ? (
                <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/70 backdrop-blur-sm">
                  Analytics preview (mobile-optimized).
                </div>
              ) : (
                <JournalAnalyticsAnimation />
              )}
            </div>


          </div>
        </section>

        {/* AI Insights & Reminders (separate from bento) */}
        <section className="relative container mx-auto mt-16 mb-24 max-w-7xl px-4 md:mt-24">
          <div className="relative overflow-hidden rounded-[44px] border border-white/10 bg-white/3 p-8 backdrop-blur-md md:p-12">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-white/6 opacity-70" />
            {isMobileUa ? null : (
              <>
                <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-600/15 blur-[120px]" />
                <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-orange-500/10 blur-[140px]" />
              </>
            )}

            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="text-left">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
                  {isMobileUa ? (
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500/70" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  AI insights & reminders
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Get nudges at the exact moment you need them
                </h2>
                <p className="mt-4 max-w-xl text-base text-gray-300/80">
                  Personalized notifications based on your plan: best trading
                  window, edge days, risk limits, and “stop trading” alerts.
                  Tap a notification to open details—or “launch” the app view.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link href={primaryCtaHref} className="inline-block">
                    <Button
                      as="div"
                      borderRadius="1.75rem"
                      containerClassName="h-12 w-auto min-w-[160px]"
                      className="bg-white text-black font-medium border-neutral-200 dark:border-slate-800 cursor-pointer"
                    >
                      {primaryCtaLabel} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/admin/dashboard" className="inline-block">
                    <Button
                      as="div"
                      borderRadius="1.75rem"
                      containerClassName="h-12 w-auto min-w-[180px]"
                      className="bg-transparent text-white border-white/20 hover:bg-white/10 cursor-pointer"
                    >
                      View dashboard demo
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70 backdrop-blur-sm">
                    <div className="text-xs font-semibold text-white/80">
                      Plan violations
                    </div>
                    <div className="mt-1 text-[13px] leading-snug">
                      “Violating Trading Plan” alerts when you break your rules.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70 backdrop-blur-sm">
                    <div className="text-xs font-semibold text-white/80">
                      Edge reminders
                    </div>
                    <div className="mt-1 text-[13px] leading-snug">
                      Best windows, edge days, and risk guard notifications.
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex justify-center lg:justify-end">
                {isMobileUa ? (
                  <div className="rounded-3xl border border-white/10 bg-black/30 p-8 text-sm text-white/70 backdrop-blur-sm">
                    iPhone notification demo is disabled on mobile for performance.
                  </div>
                ) : (
                  <div className="relative">
                    <IphoneInteractiveHint className="top-14 right-full mr-3 hidden lg:block" />
                    <div className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-md">
                      <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-orange-500/80 shadow-[0_0_10px_rgba(249,115,22,0.45)]" />
                      Tap a notification
                    </div>
                    <IphoneNotificationDemo />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>




        <PricingSection />


      </main >
    </div >
  );
}
