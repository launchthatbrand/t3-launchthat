import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Globe,
  Lock,
  MessageSquare,
  Send,
  Smartphone,
  Zap,
} from "lucide-react";

import { Button } from "@acme/ui/moving-border";
import { GlassTitle } from "../../../../components/landing/GlassTitle";
import { Grid } from "@acme/ui/features-section";
import Link from "next/link";
import React from "react";
import { ShootingStars } from "@acme/ui/shooting-stars";
import { WarpBackground } from "@acme/ui/warp-background";
import { auth } from "@clerk/nextjs/server";

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

function TelegramEmbedMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E1621] shadow-2xl">
      {/* Telegram Header Mock */}
      <div className="flex items-center gap-3 bg-[#17212B] px-4 py-3 border-b border-black/20">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#2AABEE] to-[#229ED9] text-white font-bold text-sm">
          TL
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Trader Launchpad Signals</div>
          <div className="text-xs text-[#7F91A4]">12,405 subscribers</div>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-[url('https://web.telegram.org/img/bg_0.png')] bg-cover">
        <div className="flex flex-col gap-4">

          {/* Date separator */}
          <div className="flex justify-center">
            <span className="rounded-full bg-[#000000]/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
              Today
            </span>
          </div>

          {/* Message Bubble */}
          <div className="self-start max-w-[480px] rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm bg-[#182533] p-3 shadow-sm border border-white/5">
            <div className="mb-1 text-sm font-bold text-[#2AABEE]">
              Trader Launchpad Bot
            </div>

            <div className="text-[15px] leading-relaxed text-white">
              <div className="font-bold">🚀 NEW SIGNAL: XAUUSD (GOLD)</div>
              <div className="mt-2">
                <span className="font-semibold text-[#22C55E]">BUY LIMIT</span> @ 2035.50
              </div>
              <div className="mt-1 flex gap-4 text-sm opacity-90">
                <span>TP1: 2040.00</span>
                <span>TP2: 2045.00</span>
              </div>
              <div className="mt-1 text-sm text-[#EF4444] opacity-90">
                SL: 2028.00
              </div>

              <div className="mt-3 rounded-lg overflow-hidden border border-white/10 relative h-[140px] w-full bg-[#0E1621]">
                <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">
                  Chart Snapshot
                </div>
                {/* Simple mock chart line */}
                <svg className="absolute bottom-0 left-0 right-0 h-full w-full opacity-60" preserveAspectRatio="none">
                  <path d="M0,100 C50,80 100,120 150,60 C200,40 250,90 300,20 L300,140 L0,140 Z" fill="url(#grad)" />
                  <path d="M0,100 C50,80 100,120 150,60 C200,40 250,90 300,20" fill="none" stroke="#22C55E" strokeWidth="2" />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#22C55E', stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: '#22C55E', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="mt-2 flex items-center justify-end gap-1 text-xs text-[#7F91A4]">
                <span>2:45 PM</span>
                <CheckCircle2 className="h-3 w-3 text-[#2AABEE]" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default async function TelegramMarketingPage() {
  const { userId } = await auth();
  const primaryCtaHref = userId ? "/admin/integrations/telegram" : "/sign-in";
  const primaryCtaLabel = userId ? "Connect Telegram" : "Get started";
  const connectBrokerHref = userId ? "/admin/settings/connections" : "/sign-in";

  return (
    <div>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShootingStars
          starColor="#229ED9"
          trailColor="#2AABEE"
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
              <div className="inline-flex items-center gap-2 rounded-full border border-[#229ED9]/30 bg-[#229ED9]/10 px-4 py-1.5 text-xs font-medium text-[#7CD4FF] backdrop-blur-sm">
                <Send className="h-4 w-4" />
                Telegram Signal Bot
              </div>

              <h1 className="mt-8 text-5xl font-bold tracking-tight md:text-7xl">
                <span className="block leading-none">

                  Instant Signals
                </span>
                <span className="block leading-none text-transparent bg-clip-text bg-linear-to-b from-white to-white/50">delivered to</span>
                <span className="block leading-none text-transparent bg-clip-text bg-linear-to-b from-white to-white/50">every pocket</span>
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-8 text-white/60">
                Reach your audience where they are. Broadcast trade signals,
                market updates, and educational content instantly to thousands of subscribers.
                Connect your broker once and signals can be posted automatically.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href={primaryCtaHref} className="inline-block">
                  <Button
                    as="div"
                    borderRadius="1.75rem"
                    containerClassName="h-14 w-auto min-w-[220px]"
                    className="bg-white text-black text-lg font-bold border-neutral-200 dark:border-slate-800 transition-transform hover:scale-[1.02] cursor-pointer"
                  >
                    <span className="flex w-full items-center justify-between gap-4 px-2">
                      <span className="w-full">{primaryCtaLabel}</span>
                      <span className="flex min-h-8 min-w-8 items-center justify-center rounded-full bg-black text-white">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </span>
                  </Button>
                </Link>
                <Link
                  href="/admin/integrations"
                  className={cx(
                    "rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-medium text-white/80",
                    "hover:bg-white/10 transition-colors"
                  )}
                >
                  View all integrations
                </Link>
                <Link
                  href={connectBrokerHref}
                  className={cx(
                    "rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-medium text-white/80",
                    "hover:bg-white/10 transition-colors"
                  )}
                >
                  Connect broker
                </Link>
              </div>
            </div>

            <div className="relative lg:ml-auto w-full max-w-lg lg:max-w-none">
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-[3rem] bg-linear-to-tr from-[#229ED9]/20 via-blue-500/10 to-transparent blur-3xl" />
              <div className="relative transform transition-all hover:scale-[1.01] duration-500">
                <TelegramEmbedMock />
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Grid */}
        <section className="container mx-auto mt-32 max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Built for speed
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Low latency delivery for high-frequency trading groups
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Instant Delivery"
              description="Signals bypass complex routing to land in subscriber phones milliseconds after you post them."
            />
            <FeatureCard
              icon={<Smartphone className="h-6 w-6" />}
              title="Broker-connected automation"
              description="Connect a broker once and let trades/signals publish automatically—no manual copy/paste to Telegram."
            />
            <FeatureCard
              icon={<Lock className="h-6 w-6" />}
              title="Channel Management"
              description="Automatically add/remove users from your VIP channels based on their subscription status."
            />
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto mt-32 max-w-7xl px-4">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#229ED9] mb-8">
                <Globe className="h-4 w-4" />
                GLOBAL REACH
              </div>
              <h3 className="text-3xl font-bold text-white mb-8">
                Your channel, automated
              </h3>

              <div className="grid gap-4">
                {[
                  {
                    icon: <Send className="h-5 w-5" />,
                    title: "Broadcast to Unlimited Users",
                    desc: "No caps on channel size. Send to 10 or 100,000 users instantly."
                  },
                  {
                    icon: <Bell className="h-5 w-5" />,
                    title: "Custom Alert Sounds",
                    desc: "Support for urgency levels that can trigger different notification behaviors."
                  },
                  {
                    icon: <MessageSquare className="h-5 w-5" />,
                    title: "Rich Media Support",
                    desc: "Include charts, voice notes, and video analysis directly in your signal posts."
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

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h3 className="text-2xl font-bold text-white mb-8">
                Setup steps
              </h3>
              <div className="space-y-2">
                <Step
                  index="1"
                  title="Connect your broker"
                  description="Link your trading account so trade events and signal templates can send automatically."
                />
                <Step
                  index="2"
                  title="Create a Bot"
                  description="Use @BotFather to create a new bot token in 30 seconds."
                />
                <Step
                  index="3"
                  title="Connect Channel"
                  description="Add your bot as an admin to your Telegram channel or group."
                />
                <Step
                  index="4"
                  title="Link to Launchpad"
                  description="Paste your token into Trader Launchpad to establish the connection."
                />
                <Step
                  index="5"
                  title="Start Broadcasting"
                  description="Signals, trade summaries, and charts can post automatically from your broker-connected data."
                  last
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto mt-32 max-w-5xl px-4">
          <WarpBackground
            className="overflow-hidden rounded-3xl border-white/10 bg-black/40 mask-[radial-gradient(closest-side,black_62%,transparent_100%)] mask-no-repeat mask-size-[100%_100%]"
            gridColor="rgba(34, 158, 217, 0.2)"
          >
            <div className="relative z-10 flex flex-col items-center text-center py-16 px-4">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                Ready to launch your channel?
              </h2>
              <p className="max-w-2xl text-lg text-white/60 mb-10">
                Start sending professional signals to your Telegram audience today.
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
