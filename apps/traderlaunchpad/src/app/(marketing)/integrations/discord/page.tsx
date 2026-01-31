import {
  ArrowRight,
  Bot,
  FileText,
  Image as ImageIcon,
  Link2,
  ListChecks,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Timer,
  Waypoints,
  Zap,
} from "lucide-react";

import { Button } from "@acme/ui/moving-border";
import { GlassTitle } from "../../../../components/landing/GlassTitle";
import { Grid } from "@acme/ui/features-section";
import Link from "next/link";
import React from "react";
import { ShootingStars } from "@acme/ui/shooting-stars";
import { WarpBackground } from "@acme/ui/warp-background";
import { cookies, headers } from "next/headers";
import { TENANT_SESSION_COOKIE_NAME } from "launchthat-plugin-core-tenant/next/tenant-session";

const cx = (...classes: (string | undefined | false)[]) =>
  classes.filter(Boolean).join(" ");

function FeatureCard(props: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-3xl bg-linear-to-b from-white/10 to-white/5 p-6 backdrop-blur-sm border border-white/10",
        props.className
      )}
    >
      <Grid size={20} />
      <div className="relative z-20">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-white/90">
          {props.icon}
        </div>
        <div className="text-base font-bold text-white">{props.title}</div>
        <div className="mt-2 text-sm leading-6 text-white/70">
          {props.description}
        </div>
      </div>
    </div>
  );
}

function Step(props: {
  index: string;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-6">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white z-10">
          {props.index}
        </div>
        {!props.last && (
          <div className="h-full w-px bg-linear-to-b from-white/20 to-transparent my-2" />
        )}
      </div>
      <div className="pb-10">
        <div className="text-lg font-semibold text-white">{props.title}</div>
        <div className="mt-2 text-sm leading-6 text-white/70 max-w-md">
          {props.description}
        </div>
      </div>
    </div>
  );
}

function DiscordEmbedMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#313338] shadow-2xl">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-500" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[16px] font-medium text-white hover:underline cursor-pointer">
                Trader Launchpad
              </div>
              <span className="rounded-[3px] bg-[#5865F2] px-1.5 py-px text-[10px] font-medium text-white">
                APP
              </span>
              <div className="text-xs text-[#949BA4] ml-1">Today at 9:41 AM</div>
            </div>

            <div className="mt-1 max-w-[560px] overflow-hidden rounded-md border-l-4 border-l-[#22C55E] bg-[#2B2D31] p-3 sm:p-4">
              <div className="whitespace-pre-wrap text-[14px] leading-5.5 text-[#DBDEE1]">
                <span className="font-bold text-white">🔔 NEW SIGNAL: BTCUSD</span>
                {"\n"}
                Direction: <span className="font-bold text-[#22C55E]">LONG</span> 🚀
                {"\n"}
                Entry: <span className="font-mono bg-[#1E1F22] rounded px-1 text-[#22C55E]">$94,250</span>
                {"\n"}
                Community Sentiment: <span className="font-bold text-[#22C55E]">85% Bullish</span> (120 users long)
                {"\n"}
                <span className="text-xs text-[#949BA4] mt-2 block">Signal valid for 4 hours • High Confidence</span>
              </div>

              <div className="mt-3 overflow-hidden rounded-lg bg-[#1E1F22]">
                <div className="relative h-[200px] w-full bg-linear-to-br from-[#2B2D31] to-[#1E1F22]">
                  <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
                    Chart Snapshot Preview
                  </div>
                  {/* Mock chart bars */}
                  <div className="absolute bottom-0 left-4 right-4 h-[120px] flex items-end justify-between gap-1 opacity-50">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-full rounded-t-sm ${i > 12 ? 'bg-[#22C55E]' : Math.random() > 0.4 ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}
                        style={{ height: `${30 + Math.random() * 70}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DiscordMarketingPage() {
  const cookieStore = await cookies();
  const hasTenantSession = Boolean(cookieStore.get(TENANT_SESSION_COOKIE_NAME)?.value);
  const primaryCtaHref = hasTenantSession ? "/admin/integrations/discord" : "/sign-in";
  const primaryCtaLabel = hasTenantSession ? "Open Discord settings" : "Connect Broker";


  const headerList = await headers();
  const userAgent = headerList.get("user-agent") ?? "";
  const isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

  return (
    <div>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShootingStars
          starColor="#5865F2"
          trailColor="#2EB9DF"
          minDelay={1000}
          maxDelay={3000}
          className="opacity-40"
        />
      </div>

      <main className="relative z-10 pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto max-w-7xl px-4">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-1.5 text-xs font-medium text-[#cfd4ff] backdrop-blur-sm">
                <Bot className="h-4 w-4" />
                Discord bot + automations
              </div>

              <h1 className="mt-8 text-5xl font-bold tracking-tight md:text-7xl">
                Launch your
                <span className="block leading-none text-transparent bg-clip-text bg-linear-to-b from-white to-white/50">Signal Service &</span>
                <span className="block leading-none text-transparent bg-clip-text bg-linear-to-b from-white to-white/50">Trading Community</span>
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-8 text-white/60">
                Automated trade signals, community insights, and member analytics.
                Connect your broker once and Trader Launchpad automatically posts
                signals, trade activity, and community sentiment to Discord.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href={primaryCtaHref} className="inline-block">
                  <Button
                    as="div"
                    borderRadius="1.75rem"
                    containerClassName="h-14 w-auto min-w-[220px]"
                    className="bg-white text-black text-lg text-center font-bold border-neutral-200 dark:border-slate-800 transition-transform hover:scale-[1.02] cursor-pointer"
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
            </div>

            <div className="relative lg:ml-auto w-full max-w-lg lg:max-w-none">
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-[3rem] bg-linear-to-tr from-[#5865F2]/20 via-purple-500/10 to-transparent blur-3xl" />
              <div className="relative transform transition-all hover:scale-[1.01] duration-500">
                <DiscordEmbedMock />
              </div>
              {isMobileUa ? null : (
                <div className="mt-6 text-center text-xs text-white/30 font-mono">
                  Preview mock shows real template tokens & embed style
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Key Features Grid */}
        <section className="container mx-auto mt-32 max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Powerful tools to manage your trading community on Discord
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Waypoints className="h-6 w-6" />}
              title="Community Insights"
              description="Aggregate member trades to show real-time sentiment. Let your community see what everyone else is trading."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Automated Signals"
              description="Post buy/sell signals automatically for your paid users. Perfect for signal services and trading groups."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Automations"
              description="WHEN a trigger happens (or on a schedule), DO an action like posting a cumulative summary."
            />
          </div>
        </section>

        {/* Detailed Features & How it works */}
        <section className="container mx-auto mt-32 max-w-7xl px-4">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#5865F2] mb-8">
                <ListChecks className="h-4 w-4" />
                WHAT'S INCLUDED
              </div>
              <h3 className="text-3xl font-bold text-white mb-8">
                Full control over your bot
              </h3>

              <div className="grid gap-4">
                {[
                  {
                    icon: <MessagesSquare className="h-5 w-5" />,
                    title: "Previews & Test Sends",
                    desc: "Render templates with mock data and send test messages to validate formatting."
                  },
                  {
                    icon: <ImageIcon className="h-5 w-5" />,
                    title: "Rich Attachments",
                    desc: "Use generated chart snapshots or custom images from your media library."
                  },
                  {
                    icon: <Timer className="h-5 w-5" />,
                    title: "Signal Automation",
                    desc: "Schedule market summaries or trigger buy/sell signals instantly when conditions are met."
                  },
                  {
                    icon: <Link2 className="h-5 w-5" />,
                    title: "User Linking",
                    desc: "Members can link their Discord account for personalized actions."
                  },
                  {
                    icon: <Sparkles className="h-5 w-5" />,
                    title: "Support AI",
                    desc: "Configure support channels and escalation settings for faster responses."
                  },
                  {
                    icon: <ShieldCheck className="h-5 w-5" />,
                    title: "Audit Logs",
                    desc: "A shared events table powers automations and provides a full audit trail."
                  }
                ].map((item, i) => (
                  <div key={i} className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/2 p-4 hover:bg-white/5 transition-colors">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/80 group-hover:bg-white/10 group-hover:text-white transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-sm leading-relaxed text-white/60">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#5865F2] mb-8">
                <Zap className="h-4 w-4" />
                HOW IT WORKS
              </div>
              <h3 className="text-3xl font-bold text-white mb-12">
                Setup in minutes
              </h3>

              <div className="pl-4">
                <Step
                  index="1"
                  title="Connect your broker"
                  description="Link your trading account once. Trades and signals can then post automatically to your community."
                />
                <Step
                  index="2"
                  title="Connect your Discord server"
                  description="Install the bot, approve permissions, and select which guild(s) to connect for your organization."
                />
                <Step
                  index="3"
                  title="Pick channels + routing"
                  description="Choose channels for mentor/member feeds and set rules so events land in the right place."
                />
                <Step
                  index="4"
                  title="Design templates"
                  description="Write the message once, add variables, and optionally include a chart snapshot or custom image."
                />
                <Step
                  index="5"
                  title="Create automations"
                  description="Schedule messages (hourly/daily) or react to events, with optional conditions like “market open”."
                  last
                />
              </div>


            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto mt-32 max-w-5xl px-4">
          <WarpBackground className="overflow-hidden rounded-3xl border-white/10 bg-black/40 mask-[radial-gradient(closest-side,black_62%,transparent_100%)] mask-no-repeat mask-size-[100%_100%]">
            <div className="relative z-10 flex flex-col items-center text-center py-16 px-4">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                Supercharge your Discord community
              </h2>
              <p className="max-w-2xl text-lg text-white/60 mb-10">
                Join hundreds of trading communities using Trader Launchpad to automate their operations.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href={primaryCtaHref} className="inline-block">
                  <Button
                    as="div"
                    borderRadius="1.75rem"
                    containerClassName="h-12 w-auto min-w-[200px]"
                    className="bg-white text-black text-base font-bold border-neutral-200 dark:border-slate-800 transition-transform hover:scale-[1.02] cursor-pointer"
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
            </div>
          </WarpBackground>
        </section>
      </main>
    </div>
  );
}
