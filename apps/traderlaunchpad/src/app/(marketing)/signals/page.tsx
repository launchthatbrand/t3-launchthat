import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bot,
  ChartCandlestick,
  ClipboardList,
  CreditCard,
  Globe,
  Lock,
  MessagesSquare,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  Waypoints,
  Zap,
} from "lucide-react";

import { Button } from "@acme/ui/moving-border";
import { Grid } from "@acme/ui/features-section";
import Link from "next/link";
import React from "react";
import { ShootingStars } from "@acme/ui/shooting-stars";
import { WarpBackground } from "@acme/ui/warp-background";
import { cookies } from "next/headers";
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
        "relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-white/10 to-white/5 p-6 backdrop-blur-sm",
        props.className,
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
        <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
          {props.index}
        </div>
        {!props.last ? (
          <div className="my-2 h-full w-px bg-linear-to-b from-white/20 to-transparent" />
        ) : null}
      </div>
      <div className="pb-10">
        <div className="text-lg font-semibold text-white">{props.title}</div>
        <div className="mt-2 max-w-md text-sm leading-6 text-white/70">
          {props.description}
        </div>
      </div>
    </div>
  );
}

function SignalPipelineMock() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
      <div className="border-b border-white/10 bg-black/20 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/10" />
            <div>
              <div className="text-sm font-semibold text-white">
                Signal Operations
              </div>
              <div className="text-xs text-white/50">
                Broker-connected → automated distribution
              </div>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            Live preview
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white/80">
                Trigger
              </div>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
                auto
              </span>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/80">
                <ChartCandlestick className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">
                  Broker trade detected
                </div>
                <div className="mt-1 text-sm text-white/60">
                  “BTCUSD — LONG @ $94,250”
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white/80">
                Message
              </div>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
                template
              </span>
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">Template</div>
              <div className="mt-1 text-sm font-semibold text-white">
                VIP Signal Alert
              </div>
              <div className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/70">
                {"🔔 NEW SIGNAL: {{symbol}}"}{"\n"}
                {"Direction: {{direction}}"}{"\n"}
                {"Entry: {{entry}}"}{"\n"}
                {"Confidence: {{confidence}}"}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white/80">
                Destinations
              </div>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
                routing
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Bot className="h-4 w-4 text-[#5865F2]" />
                  Discord (VIP channel)
                </div>
                <span className="text-xs text-[#22C55E]">sent</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Send className="h-4 w-4 text-[#229ED9]" />
                  Telegram (broadcast)
                </div>
                <span className="text-xs text-[#22C55E]">sent</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <ClipboardList className="h-4 w-4 text-white/60" />
                  Audit log
                </div>
                <span className="text-xs text-white/50">recorded</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-linear-to-r from-[#5865F2]/10 via-white/5 to-[#229ED9]/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">
                Your edge: proof + automation
              </div>
              <div className="mt-1 text-sm text-white/60">
                Trades and alerts come from broker-connected data, not manual
                copy/paste.
              </div>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
              reduces errors
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function SignalsMarketingPage() {
  const hasTenantSession = Boolean(cookies().get(TENANT_SESSION_COOKIE_NAME)?.value);
  const primaryCtaHref = hasTenantSession ? "/admin/dashboard" : "/sign-in";
  const primaryCtaLabel = hasTenantSession ? "Open dashboard" : "Get started";
  const connectBrokerHref = hasTenantSession ? "/admin/settings/connections" : "/sign-in";
  const discordHref = "/integrations/discord";
  const telegramHref = "/integrations/telegram";

  return (
    <div >
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShootingStars
          starColor="#5865F2"
          trailColor="#2EB9DF"
          minDelay={1000}
          maxDelay={3000}
          className="opacity-35"
        />
      </div>

      <main className="relative z-10 pt-32 pb-20">
        {/* Hero */}
        <section className="container mx-auto max-w-7xl px-4">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-1.5 text-xs font-medium text-[#cfd4ff] backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                Built for signal services
              </div>

              <h1 className="mt-8 text-5xl font-bold tracking-tight md:text-7xl">
                <span className="block leading-none">
                  Signals that
                </span>
                <span className="block leading-none text-transparent bg-clip-text bg-linear-to-b from-white to-white/50">
                  run themselves
                </span>
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-8 text-white/60">
                Connect your broker once and automate the boring parts: posting
                buy/sell alerts, showing community sentiment, delivering chart
                snapshots, and keeping a transparent audit trail your members
                can trust.
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
                  href={connectBrokerHref}
                  className={cx(
                    "rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-medium text-white/80",
                    "hover:bg-white/10 transition-colors",
                  )}
                >
                  Connect broker
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/50">Broadcast channels</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                    <a className="hover:underline" href={discordHref}>
                      Discord
                    </a>
                    <span className="text-white/30">•</span>
                    <a className="hover:underline" href={telegramHref}>
                      Telegram
                    </a>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/50">Trust & proof</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    Broker-connected + audit log
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-[3rem] bg-linear-to-tr from-[#5865F2]/20 via-purple-500/10 to-transparent blur-3xl" />
              <SignalPipelineMock />
              <div className="mt-6 text-center text-xs text-white/30 font-mono">
                Example workflow. Your rules, templates, and channels are fully
                customizable.
              </div>
            </div>
          </div>
        </section>

        {/* Top value props */}
        <section className="container mx-auto mt-32 max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Built for the realities of running signals
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Most signal services fail on operations. Trader Launchpad turns
              operations into a system.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Automated distribution"
              description="Signals publish automatically to Discord/Telegram the moment trades happen—no manual copy/paste, no delays."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Community insight"
              description="Let members see what the community is trading, overall sentiment, and activity—turn chatter into actionable context."
            />
            <FeatureCard
              icon={<BadgeCheck className="h-6 w-6" />}
              title="Trust & transparency"
              description="Broker-connected data + audit log helps you prove performance and reduce disputes about “edited” signals."
            />
          </div>
        </section>

        {/* Ops breakdown */}
        <section className="container mx-auto mt-32 max-w-7xl px-4">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#5865F2] mb-8">
                <ClipboardList className="h-4 w-4" />
                SIGNAL SERVICE PLAYBOOK
              </div>
              <h3 className="text-3xl font-bold text-white mb-8">
                The business processes we automate
              </h3>

              <div className="grid gap-4">
                {[
                  {
                    icon: <MessagesSquare className="h-5 w-5" />,
                    title: "Signal creation → template",
                    desc: "Standardize formatting with templates (variables, badges, charts). Reduce human error and improve clarity.",
                  },
                  {
                    icon: <Waypoints className="h-5 w-5" />,
                    title: "Distribution → routing",
                    desc: "Route VIP vs public alerts, different symbols, or different strategies to different channels—automatically.",
                  },
                  {
                    icon: <Timer className="h-5 w-5" />,
                    title: "Schedules → automations",
                    desc: "Hourly summaries, daily recaps, “only when market open” rules, and event-driven broadcasts.",
                  },
                  {
                    icon: <Lock className="h-5 w-5" />,
                    title: "Membership workflows",
                    desc: "Pair paid access with role-based channels (Discord) and controlled broadcast channels (Telegram).",
                  },
                  {
                    icon: <Activity className="h-5 w-5" />,
                    title: "Performance → credibility",
                    desc: "Broker-connected tracking + audit logs help prove what was sent and when—so you can scale trust.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/2 p-4 hover:bg-white/5 transition-colors"
                  >
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
                Go from broker → broadcast
              </h3>

              <div className="pl-4">
                <Step
                  index="1"
                  title="Connect your broker"
                  description="Link your trading account once. Trade events and positions become inputs for templates and automations."
                />
                <Step
                  index="2"
                  title="Choose your channels"
                  description="Connect Discord and/or Telegram, then choose VIP/public destinations and routing rules."
                />
                <Step
                  index="3"
                  title="Create templates"
                  description="Design your signal format once. Add variables, sentiment badges, and optional chart snapshots."
                />
                <Step
                  index="4"
                  title="Turn on automations"
                  description="Schedule summaries and recaps, or trigger alerts instantly when events happen (with optional conditions)."
                />
                <Step
                  index="5"
                  title="Scale with confidence"
                  description="Every send is recorded. Audit trails + broker-connected data reduce disputes and make operations repeatable."
                  last
                />
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <a
                  href={discordHref}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Bot className="h-4 w-4 text-[#5865F2]" />
                    Discord integration
                    <ArrowRight className="ml-auto h-4 w-4 text-white/50 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="mt-2 text-sm text-white/60">
                    VIP channels, routing, templates, and automation rules.
                  </div>
                </a>
                <a
                  href={telegramHref}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Send className="h-4 w-4 text-[#229ED9]" />
                    Telegram integration
                    <ArrowRight className="ml-auto h-4 w-4 text-white/50 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="mt-2 text-sm text-white/60">
                    Broadcast signals instantly to your subscribers.
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Business outcomes */}
        <section className="container mx-auto mt-32 max-w-7xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<CreditCard className="h-6 w-6" />}
              title="Built for paid services"
              description="Run VIP channels, automate delivery, and keep a clean paper trail—so you can focus on growth and retention."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Reduce support overhead"
              description="Clear templates, consistent formatting, and audit logs reduce “what did you mean?” tickets and disputes."
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="Scale across platforms"
              description="Use one source of truth (broker data) and broadcast to Discord + Telegram without duplicating effort."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto mt-32 max-w-5xl px-4">
          <WarpBackground
            className="overflow-hidden rounded-3xl border-white/10 bg-transparent mask-[radial-gradient(closest-side,black_62%,transparent_100%)] mask-no-repeat mask-size-[100%_100%]"
          >
            <div className="relative z-10 flex flex-col items-center text-center py-16 px-4">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                Launch your signal ops system
              </h2>
              <p className="max-w-2xl text-lg text-white/60 mb-10">
                Connect your broker, automate delivery, and give your members
                real insight into what the community is trading.
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
                <Link
                  href={connectBrokerHref}
                  className={cx(
                    "rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-medium text-white/80",
                    "hover:bg-white/10 transition-colors",
                  )}
                >
                  Connect broker
                </Link>
              </div>
            </div>
          </WarpBackground>
        </section>
      </main>
    </div>
  );
}

