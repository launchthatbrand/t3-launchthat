import {
  AppleLogo,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  ContainerScroll,
  FlipWords,
  GooglePlayLogo,
  OrbitingCircles,
  ShineBorder,
  TextGenerateEffect,
} from "@acme/ui";
import {
  ArrowRight,
  BarChart3,
  Code,
  Globe,
  MessageSquare,
  Sparkles,
  User,
  Users,
  Webhook,
} from "lucide-react";
import {
  demoBrokers,
  demoPropFirms,
  demoPublicProfiles,
} from "@acme/demo-data";

import { BrokersPlatformsHoverAnimation } from "../../components/landing/BrokersPlatformsHoverAnimation";
import { DarkOnly } from "~/components/theme/DarkOnly";
import { HeroCtaInstallBlock } from "../../components/landing/HeroCtaInstallBlock";
import { IphoneInteractiveHint } from "../../components/landing/IphoneInteractiveHint";
import { IphoneNotificationDemo } from "../../components/landing/IphoneNotificationDemo";
import { JournalAnalyticsAnimation } from "../../components/landing/JournalAnalyticsAnimation";
import Link from "next/link";
import { Marquee } from "@acme/ui/marquee";
import { PricingSection } from "../../components/landing/PricingSection";
import React from "react";
import { SpinningSphere } from "~/components/landing/SpinningSphere";
import { StrategyBuilderAnimation } from "../../components/landing/StrategyBuilderAnimation";
import { ThemeAwareSafariPreview } from "../../components/landing/ThemeAwareSafariPreview";
import { headers, cookies } from "next/headers";
import { TENANT_SESSION_COOKIE_NAME } from "launchthat-plugin-core-tenant/next/tenant-session";

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
  const hasTenantSession = Boolean(cookies().get(TENANT_SESSION_COOKIE_NAME)?.value);
  const primaryCtaHref = hasTenantSession ? "/admin/dashboard" : "/sign-in";
  const primaryCtaLabel = hasTenantSession ? "Dashboard" : "Get Started";

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

  const widgetSnippet = [
    `<script type="module" src="https://traderlaunchpad.com/widgets/tdrlp-widgets.es.js"></script>`,
    `<tdrlp-economic-calendar`,
    `  api-base="https://api.traderlaunchpad.com"`,
    `  news-base="https://traderlaunchpad.com/news/forex/calendar?ref=YOUR_CODE"`,
    `  preset="thisWeek"`,
    `></tdrlp-economic-calendar>`,
  ].join("\n");

  return (
    <div className="text-foreground relative min-h-screen selection:bg-orange-500/30">
      <main className="relative z-10 pt-5">
        {/* Hero Section */}
        <section className="relative container mx-auto max-w-7xl px-4 text-center">
          {isMobileUa ? (
            <>
              {/* Mobile: keep it light (no canvas + no heavy text/scroll animations) */}
              <div className="mx-auto w-fit rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-black backdrop-blur-sm dark:text-orange-200">
                Free Trading Journal and AI Powered Analytics
              </div>
              <div className="mb-12 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
                <Link
                  href="#"
                  className="border-foreground/15 bg-foreground/5 text-foreground/80 hover:bg-foreground/10 hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-4 py-2 backdrop-blur-sm transition"
                >
                  <AppleLogo size={26} color="currentColor" />
                  <div className="flex flex-col">
                    <span className="text-foreground/50 text-[10px] font-medium tracking-[0.2em]">
                      AVAILABLE ON
                    </span>
                    <span className="text-lg font-semibold">iOS App Store</span>
                  </div>
                </Link>
                <Link
                  href="#"
                  className="border-foreground/15 bg-foreground/5 text-foreground/80 hover:bg-foreground/10 hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-4 py-2 backdrop-blur-sm transition"
                >
                  <GooglePlayLogo size={26} color="currentColor" />
                  <div className="flex flex-col">
                    <span className="text-foreground/50 text-[10px] font-medium tracking-[0.2em]">
                      GET IT ON
                    </span>
                    <span className="text-lg font-semibold">Google Play</span>
                  </div>
                </Link>
              </div>
              <h1 className="mx-auto max-w-5xl text-5xl leading-[0.95] font-bold tracking-tight md:text-7xl lg:text-8xl">
                <span className="block leading-none">
                  {/* <GlassTitle
                    text="Mission Control"
                    className="h-[2.05em] -mb-8 w-auto max-w-full align-middle"
                  /> */}
                  Mission Control
                </span>
                <div className="mx-auto mt-3 mb-3 flex items-center justify-center gap-4 md:mt-4 md:mb-4">
                  <div className="to-foreground/30 h-px w-12 bg-linear-to-r from-transparent md:w-24" />
                  <span className="text-foreground/50 relative font-mono text-xs font-medium tracking-[0.5em] md:text-sm">
                    FOR
                  </span>
                  <div className="to-foreground/30 h-px w-12 bg-linear-to-l from-transparent md:w-24" />
                </div>
                <span className="block leading-none">Trading Communities</span>
              </h1>

              <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-center text-lg font-medium md:text-xl">
                Turn trades into a plan—AI insights, reminders, and
                broker-connected analytics so you trade with confidence.
              </p>

              <div className="mt-12 mb-6 flex justify-center">
                <Link href={primaryCtaHref} className="inline-block">
                  <span className="relative inline-flex h-14 min-w-[200px] items-center justify-center rounded-[1.75rem] border border-neutral-200 bg-white text-lg font-bold text-black transition-transform hover:scale-105 dark:border-slate-800">
                    <ShineBorder
                      borderWidth={2}
                      duration={12}
                      shineColor={["#f97316", "#fb923c", "#f97316"]}
                      className="rounded-[inherit]"
                    />
                    <span className="relative z-10 flex w-full items-center justify-between gap-4 px-2">
                      <span className="w-full">{primaryCtaLabel}</span>
                      <span className="flex min-h-8 min-w-8 items-center justify-center rounded-full bg-black text-white">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </span>
                  </span>
                </Link>
                <div className="mb-12 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
                  <Link
                    href="#"
                    className="w-48 border-foreground/15 bg-foreground/5 text-foreground/80 hover:bg-foreground/10 hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-4 py-2 backdrop-blur-sm transition"
                  >
                    <AppleLogo size={26} color="currentColor" />
                    <div className="flex flex-col justify-center items-center">
                      <span className="text-foreground/50 text-[10px] font-medium tracking-[0.2em]">
                        AVAILABLE ON
                      </span>
                      <span className="text-lg font-semibold">
                        iOS App Store
                      </span>
                    </div>
                  </Link>
                  <Link
                    href="#"
                    className="w-48 border-foreground/15 bg-foreground/5 text-foreground/80 hover:bg-foreground/10 hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-4 py-2 backdrop-blur-sm transition"
                  >
                    <GooglePlayLogo size={26} color="currentColor" />
                    <div className="flex w-full flex-col justify-center items-center">
                      <span className="text-foreground/50 text-[10px] font-medium tracking-[0.2em]">
                        GET IT ON
                      </span>
                      <span className="text-lg font-semibold">
                        Google Play
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="mb-12 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
                <Link
                  href="#"
                  className="border-foreground/15 bg-foreground/5 text-foreground/80 hover:bg-foreground/10 hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-4 py-2 backdrop-blur-sm transition"
                >
                  <AppleLogo size={16} color="currentColor" />
                  <span className="text-foreground/50 text-[10px] font-medium tracking-[0.2em]">
                    AVAILABLE ON
                  </span>
                  <span className="text-sm font-semibold">iOS App Store</span>
                </Link>
                <Link
                  href="#"
                  className="border-foreground/15 bg-foreground/5 text-foreground/80 hover:bg-foreground/10 hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-4 py-2 backdrop-blur-sm transition"
                >
                  <GooglePlayLogo size={16} color="currentColor" />
                  <span className="text-foreground/50 text-[10px] font-medium tracking-[0.2em]">
                    GET IT ON
                  </span>
                  <span className="text-sm font-semibold">Google Play</span>
                </Link>
              </div>

              <ThemeAwareSafariPreview
                url="traderlaunchpad.com/admin"
                lightImageSrc="/images/traderlaunchpad-backend-light.jpg"
                darkImageSrc="/images/traderlaunchpad-backend.jpg"
              />
            </>
          ) : (
            <>
              <DarkOnly>
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
              </DarkOnly>

              <ContainerScroll
                titleComponent={
                  <>
                    <div>
                      <div className="relative mx-auto mb-2 w-fit rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-black backdrop-blur-sm dark:text-orange-200">
                        <ShineBorder
                          borderWidth={1}
                          duration={12}
                          shineColor={["#f97316", "#fb923c", "#f97316"]}
                          className="rounded-full"
                        />
                        Free Trading Journal and AI Powered Analytics
                      </div>

                    </div>
                    <h1 className="mx-auto max-w-5xl text-5xl leading-[0.95] font-bold tracking-tight md:text-7xl lg:text-7xl">
                      <span className="block leading-none">
                        {/* <GlassTitle
                          text="Mission Control"
                          className="h-[2.05em] -mb-8 w-auto max-w-full align-middle"
                        /> */}
                        Mission Control
                      </span>
                      <div className="mx-auto mt-3 mb-3 flex items-center justify-center gap-4 md:mt-4 md:mb-4">
                        <div className="to-foreground/30 h-px w-12 bg-linear-to-r from-transparent md:w-24" />
                        <span className="text-foreground/50 relative font-mono text-xs font-medium tracking-[0.5em] md:text-sm">
                          FOR
                        </span>
                        <div className="to-foreground/30 h-px w-12 bg-linear-to-l from-transparent md:w-24" />
                      </div>
                      <span className="block leading-none">
                        <FlipWords
                          words={[
                            "Every Trade",
                            "Trading Groups",
                            "Data-Driven Traders",
                          ]}
                          duration={4000}
                          className="block px-0 text-center leading-none"
                          wordClassName="font-bold tracking-tight"
                          letterClassName="text-foreground dark:text-white"
                        />
                      </span>
                    </h1>

                    <TextGenerateEffect
                      words="Turn trades into a plan—AI insights, reminders, and broker-connected analytics so you trade with confidence."
                      className="mx-auto mt-6 max-w-2xl"
                      textClassName="mt-0 text-lg font-medium text-center text-muted-foreground md:text-xl"
                      wordClassName="text-muted-foreground"
                      duration={0.6}
                    />

                    <HeroCtaInstallBlock
                      primaryCtaHref={primaryCtaHref}
                      primaryCtaLabel={primaryCtaLabel}
                    />
                  </>
                }
              >
                <ThemeAwareSafariPreview
                  url="traderlaunchpad.com/admin"
                  lightImageSrc="/images/traderlaunchpad-backend-light.jpg"
                  darkImageSrc="/images/traderlaunchpad-backend.jpg"
                />
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
        <section className="relative container mx-auto mt-20 max-w-7xl px-4 pt-10 md:mt-32">
          <p className="text-muted-foreground mb-8 text-center text-sm font-medium">
            Members of the fleet
          </p>
          {isMobileUa ? (
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 opacity-90 sm:grid-cols-2 lg:grid-cols-3">
              {publicProfiles.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  href={`/u/${encodeURIComponent(p.username)}`}
                  className="border-foreground/10 bg-foreground/5 text-foreground/90 flex items-center gap-3 rounded-full border px-3 py-2 text-sm font-medium backdrop-blur-md"
                >
                  <Avatar className="border-foreground/10 h-7 w-7 border">
                    <AvatarImage src={p.avatarUrl} alt={p.username} />
                    <AvatarFallback className="bg-foreground/10 text-foreground/80 text-[11px]">
                      {p.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{p.username}</span>
                  <span className="text-foreground/55 hidden text-[11px] md:inline">
                    {p.headline ?? "Public journal"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <Marquee
              pauseOnHover
              className="mx-auto max-w-5xl opacity-50 grayscale transition-all duration-500 [--duration:48s] [--gap:4rem] hover:opacity-100 hover:grayscale-0"
              repeat={3}
            >
              {publicProfiles.map((p) => (
                <Link
                  key={p.id}
                  href={`/u/${encodeURIComponent(p.username)}`}
                  className="border-foreground/10 bg-foreground/5 text-foreground/90 flex items-center gap-3 rounded-full border px-3 py-2 text-sm font-medium backdrop-blur-md"
                >
                  <Avatar className="border-foreground/10 h-7 w-7 border">
                    <AvatarImage src={p.avatarUrl} alt={p.username} />
                    <AvatarFallback className="bg-foreground/10 text-foreground/80 text-[11px]">
                      {p.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{p.username}</span>
                  <span className="text-foreground/55 hidden text-[11px] md:inline">
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

        <section
          id="features"
          className="relative container mx-auto mt-24 mb-24 max-w-7xl scroll-mt-24 px-4 md:mt-32"
        >
          {/* Bottom Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Large Card: Trading Plan Builder */}
            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300 md:col-span-2">
              <div>
                <h3 className="text-foreground text-xl font-semibold">
                  AI Strategy Builder + Trading Plan
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Start from proven templates, tune risk rules, and turn your
                  journal data into a plan with clear “when to trade / when to
                  stop” guardrails.
                </p>
              </div>

              {isMobileUa ? (
                <div className="border-foreground/10 bg-foreground/5 text-foreground/70 mt-8 rounded-2xl border p-6 text-sm backdrop-blur-sm">
                  Strategy builder preview (mobile-optimized).
                </div>
              ) : (
                <StrategyBuilderAnimation />
              )}
            </Card>

            {/* Small Card: Broker Coverage */}
            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 col-span-1 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <h3 className="text-foreground text-xl font-semibold">
                Brokers & Platforms
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Plug into your broker to pull trades, track outcomes, and power
                recommendations.
              </p>

              {isMobileUa ? (
                <div className="border-foreground/10 bg-foreground/5 text-foreground/60 mt-6 rounded-2xl border p-4 text-xs backdrop-blur-sm">
                  Broker preview (mobile-optimized).
                </div>
              ) : (
                <BrokersPlatformsHoverAnimation />
              )}
              <div className="text-muted-foreground mt-4 text-xs">
                + Discord alerts, webhooks, and automation events.
              </div>
            </Card>

            {/* Small Card: Integrations */}
            <Card className="group border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <div>
                <h3 className="text-foreground text-xl font-semibold">
                  Discord + Automations
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Pipe signals into Discord, trigger webhooks, and connect your
                  stack so your plan stays actionable.
                </p>
              </div>
              <div className="border-foreground/10 bg-foreground/3 relative mt-6 overflow-hidden rounded-2xl border p-4">
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
                    <div className="absolute inset-9 rounded-full border border-dashed border-orange-500/10 opacity-60" />
                  </div>
                </div>

                <div className="relative h-56 w-full">
                  {/* center core */}
                  {isMobileUa ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 shadow-[0_0_30px_rgba(249,115,22,0.45)]">
                        <span className="text-xs font-semibold text-white">
                          TLP
                        </span>
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
                        <OrbitingCircles
                          radius={112}
                          duration={24}
                          iconSize={44}
                          speed={1}
                        >
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
            </Card>

            {/* Medium Card: Journal Analytics */}
            <Card className="col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6 md:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-6 md:mb-0 md:max-w-xs">
                  <h3 className="text-foreground text-xl font-semibold">
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
            </Card>
          </div>
        </section>

        {/* AI Insights & Reminders (separate from bento) */}
        <section className="relative container mx-auto mt-16 mb-24 max-w-7xl px-4 md:mt-24">
          <Card className="relative overflow-hidden rounded-[44px] border border-white/10 bg-white/3 p-8 backdrop-blur-md md:p-12">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-white/6 opacity-70" />
            {isMobileUa ? null : (
              <>
                <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-600/15 blur-[120px]" />
                <div className="pointer-events-none absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-orange-500/10 blur-[140px]" />
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

                <h2 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
                  Get nudges at the exact moment you need them
                </h2>
                <p className="text-muted-foreground mt-4 max-w-xl text-base">
                  Personalized notifications based on your plan: best trading
                  window, edge days, risk limits, and “stop trading” alerts. Tap
                  a notification to open details—or “launch” the app view.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link href={primaryCtaHref} className="inline-block">
                    <span className="relative inline-flex h-12 min-w-40 items-center justify-center rounded-[1.75rem] border border-neutral-200 bg-white px-5 font-medium text-black dark:border-slate-800">
                      <ShineBorder
                        borderWidth={4}
                        duration={12}
                        shineColor={["#f97316", "#fb923c", "#f97316"]}
                        className="rounded-[inherit]"
                      />
                      <span className="relative z-10 flex items-center">
                        {primaryCtaLabel}{" "}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    </span>
                  </Link>
                  <Link href="/admin/dashboard" className="inline-block">
                    <span className="border-foreground/20 text-foreground hover:bg-foreground/5 inline-flex h-12 min-w-[180px] items-center justify-center rounded-[1.75rem] border bg-transparent px-5 font-medium transition">
                      View dashboard demo
                    </span>
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="border-foreground/10 bg-foreground/5 text-foreground/70 rounded-2xl border p-4 text-sm backdrop-blur-sm">
                    <div className="text-foreground/80 text-xs font-semibold">
                      Plan violations
                    </div>
                    <div className="mt-1 text-[13px] leading-snug">
                      “Violating Trading Plan” alerts when you break your rules.
                    </div>
                  </div>
                  <div className="border-foreground/10 bg-foreground/5 text-foreground/70 rounded-2xl border p-4 text-sm backdrop-blur-sm">
                    <div className="text-foreground/80 text-xs font-semibold">
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
                  <div className="border-foreground/10 bg-foreground/5 text-foreground/70 rounded-3xl border p-8 text-sm backdrop-blur-sm">
                    iPhone notification demo is disabled on mobile for
                    performance.
                  </div>
                ) : (
                  <div className="relative">
                    <IphoneInteractiveHint className="top-14 right-full mr-3 hidden lg:block" />
                    <div className="border-foreground/10 bg-foreground/5 text-foreground/70 pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 rounded-full border px-3 py-1 text-[11px] font-medium backdrop-blur-md">
                      <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-orange-500/80 shadow-[0_0_10px_rgba(249,115,22,0.45)]" />
                      Tap a notification
                    </div>
                    <IphoneNotificationDemo />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>

        <section className="relative container mx-auto mt-24 mb-24 max-w-7xl px-4 md:mt-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
                <Code className="h-3.5 w-3.5" />
                Free embeddable widgets
              </div>
              <h2 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
                Economic calendar + widgets that pay you back
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Drop the free Economic Calendar, News Feed, or Profile Cards on
                your site in minutes. No API keys required.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Economic Calendar & news widgets
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Keep your visitors engaged with real-time forex events and
                      headlines using our free widgets.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Affiliate credit on every click-through
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add your referral code to the widget config. If anyone
                      clicks through and signs up, you get the affiliate credit
                      (and the commission).
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/widgets"
                  className="text-sm font-medium text-orange-500 hover:text-orange-400 flex items-center gap-1"
                >
                  Explore the widget library{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/20" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/20" />
                  <div className="h-3 w-3 rounded-full bg-green-500/20" />
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  index.html
                </div>
              </div>
              <pre className="overflow-x-auto text-xs font-mono leading-relaxed text-blue-100">
                <code>{widgetSnippet}</code>
              </pre>
              <div className="mt-4 pt-4 border-t border-white/5 text-center">
                <p className="text-xs text-muted-foreground">
                  👆 Copy, paste, and add your{" "}
                  <span className="text-orange-400">?ref=CODE</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <PricingSection />
      </main>
    </div>
  );
}
