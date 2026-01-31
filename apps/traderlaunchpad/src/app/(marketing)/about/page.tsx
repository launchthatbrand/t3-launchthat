import Link from "next/link";
import { cookies } from "next/headers";
import { TENANT_SESSION_COOKIE_NAME } from "launchthat-plugin-core-tenant/next/tenant-session";
import {
  ArrowRight,
  Bot,
  Code2,
  HeartHandshake,
  LineChart,
  MessageSquare,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

import { Card, ShineBorder } from "@acme/ui";

export default async function AboutPage() {
  const cookieStore = await cookies();
  const hasTenantSession = Boolean(cookieStore.get(TENANT_SESSION_COOKIE_NAME)?.value);
  const primaryCtaHref = hasTenantSession ? "/admin/dashboard" : "/sign-in";
  const primaryCtaLabel = hasTenantSession ? "Go to Dashboard" : "Join the Community";

  return (
    <div className="text-foreground relative min-h-screen selection:bg-orange-500/30">
      <main className="relative z-10 pt-6">
        {/* Hero Section */}
        <section className="relative container mx-auto max-w-7xl px-4">
          <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-72 max-w-5xl rounded-full bg-linear-to-r from-orange-500/10 via-transparent to-orange-500/10 blur-3xl" />

          <div className="mx-auto max-w-4xl text-center">
            <div className="relative mx-auto w-fit overflow-hidden rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-black backdrop-blur-sm dark:text-orange-200">
              <ShineBorder
                borderWidth={2}
                duration={12}
                shineColor={["#f97316", "#fb923c", "#f97316"]}
                className="rounded-[inherit]"
              />
              <span className="relative z-10">Our Story</span>
            </div>

            <h1 className="mx-auto mt-6 max-w-5xl text-5xl leading-[0.95] font-bold tracking-tight md:text-7xl lg:text-8xl">
              Built by traders.
              <span className="block leading-none">Engineered for edge.</span>
            </h1>

            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-center text-lg font-medium md:text-xl">
              TraderLaunchpad started as a personal challenge: build a journal that didn't just log trades, but actually helped find an edge—without the premium price tag.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href={primaryCtaHref} className="inline-block">
                <span className="relative inline-flex h-12 min-w-[190px] items-center justify-center rounded-[1.75rem] border border-neutral-200 bg-white px-5 font-semibold text-black transition-transform hover:scale-105 dark:border-slate-800">
                  <ShineBorder
                    borderWidth={2}
                    duration={12}
                    shineColor={["#f97316", "#fb923c", "#f97316"]}
                    className="rounded-[inherit]"
                  />
                  <span className="relative z-10 flex w-full items-center justify-between gap-4 px-1">
                    <span className="w-full">{primaryCtaLabel}</span>
                    <span className="flex min-h-8 min-w-8 items-center justify-center rounded-full bg-black text-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </span>
                </span>
              </Link>
              
              <Link 
                href="https://discord.gg/placeholder" 
                target="_blank"
                className="border-foreground/10 bg-foreground/5 text-foreground/80 hover:bg-foreground/10 hover:text-foreground inline-flex h-12 items-center justify-center gap-2 rounded-full border px-6 text-sm font-medium transition-colors backdrop-blur-sm"
              >
                <MessageSquare className="h-4 w-4" />
                Join the Discord
              </Link>
            </div>
          </div>
        </section>

        {/* Social Proof / Stats Strip */}
        <section className="border-y border-white/5 bg-white/5 py-8 backdrop-blur-sm mt-16">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">10+ Years</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trading Experience</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">100%</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verified Data</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">Multi-Broker</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">US & Offshore</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">Community</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Roadmap Voting</div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Preview (Visual Proof) */}
        <section className="relative container mx-auto mt-16 max-w-6xl px-4 md:mt-24">
          <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm md:rounded-2xl">
            <div className="absolute inset-0 bg-linear-to-tr from-orange-500/10 via-transparent to-transparent" />
            
            {/* Placeholder for actual screenshot - stylized glassmorphism layout */}
            <div className="flex h-full flex-col p-4 md:p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
                <div className="h-4 w-32 rounded-full bg-white/10" />
                <div className="ml-auto h-8 w-24 rounded-full bg-orange-500/20" />
              </div>
              <div className="grid grid-cols-12 gap-4 h-full">
                <div className="col-span-3 hidden md:block space-y-4">
                  <div className="h-12 w-full rounded-lg bg-white/5" />
                  <div className="h-12 w-full rounded-lg bg-white/5" />
                  <div className="h-12 w-full rounded-lg bg-white/5" />
                </div>
                <div className="col-span-12 md:col-span-9 grid grid-rows-2 gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4" />
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4" />
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4" />
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-6 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <LineChart className="h-12 w-12 mx-auto text-orange-500/50" />
                      <p className="text-sm text-muted-foreground">Detailed edge analysis & equity curves</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overlay Label */}
            <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10">
                <ShieldCheck className="h-3 w-3 text-orange-500" />
                Live Broker Sync • No Manual Entry
              </div>
            </div>
          </div>
        </section>

        {/* The Origin Story */}
        <section className="relative container mx-auto mt-24 max-w-5xl px-4">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500">
                <Code2 className="h-4 w-4" />
                <span>The Origin</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                "Why pay for tools I can build better?"
              </h2>
              <div className="text-muted-foreground space-y-4 leading-relaxed">
                <p>
                  Years ago, I was frustrated. I wanted to journal my trades, backtest strategies, and find my edge, but every platform out there was either clunky, limited to specific brokers, or charging $30–$50/mo just for the basics.
                </p>
                <p>
                  As a software developer, I saw a challenge. I didn't want to be tied to one platform. I wanted something that worked with US regulated brokers <i>and</i> offshore options. I wanted custom alerts that pinged my Discord, SMS, or even Alexa.
                </p>
                <p>
                  So I stopped waiting for features and started coding. What began as a personal portfolio project to consolidate data has evolved into a scalable platform designed to help <i>any</i> trader find their consistency.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-orange-500/20 blur-2xl rounded-full opacity-50" />
              <Card className="relative border-foreground/10 bg-foreground/3 p-8 backdrop-blur-md">
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                      1
                    </div>
                    <div>
                      <div className="font-medium">The Frustration</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        High fees, manual entry errors, and walled gardens that didn't support the way modern traders actually operate.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                      2
                    </div>
                    <div>
                      <div className="font-medium">The 10-Year Journey</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        From building Discord bots for trading communities to architecting a full-scale data hub. This platform is the culmination of a decade in the trenches.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                      3
                    </div>
                    <div>
                      <div className="font-medium">The Result</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        A bespoke, community-driven hub that evolves as fast as the market does.
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Core Values / Differentiators */}
        <section className="relative container mx-auto mt-24 max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">More than just a journal.</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              We’re building a respectable data hub where integrity and customization come first.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm text-orange-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">Verified Data Only</div>
              </div>
              <div className="text-muted-foreground mt-3 text-sm leading-relaxed">
                <strong className="text-foreground">No manual trades allowed.</strong> We believe in data integrity. Like a modern MyFxBook, we connect directly to brokers to ensure every trade history is verified and reliable, not manipulated.
              </div>
            </Card>

            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm text-orange-500">
                  <LineChart className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">True Edge Discovery</div>
              </div>
              <div className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Test strategies across multiple asset classes and brokers. Discover exactly which setups work on which instruments—and specifically on which account types.
              </div>
            </Card>

            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm text-orange-500">
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">For Prop Challengers</div>
              </div>
              <div className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Perfect for passing evaluations. Track your drawdown limits and daily loss rules automatically across multiple accounts to keep your funding journey on track.
              </div>
            </Card>
          </div>
        </section>

        {/* Future / AI Section */}
        <section className="relative container mx-auto mt-24 mb-24 max-w-7xl px-4">
          <Card className="border-foreground/10 bg-foreground/3 relative overflow-hidden rounded-[44px] border p-8 backdrop-blur-md md:p-12">
            <div className="absolute top-0 right-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
            
            <div className="relative z-10 grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-500">
                  <Bot className="h-3 w-3" />
                  <span>The Future</span>
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight">AI that actually helps.</h2>
                <p className="text-muted-foreground mt-4 text-lg">
                  We're moving beyond simple journaling. We're integrating AI analysis, reminders, and guidance to keep you on track.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <HeartHandshake className="h-4 w-4 text-orange-500" />
                    <span>Mentorship communities & private feeds</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Bot className="h-4 w-4 text-orange-500" />
                    <span>AI agents for automated analysis</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span>Community voting on the roadmap</span>
                  </div>
                </div>
                
                <div className="mt-8">
                  <Link href={primaryCtaHref} className="inline-block">
                    <span className="relative inline-flex h-12 min-w-[190px] items-center justify-center rounded-[1.75rem] border border-neutral-200 bg-white px-5 font-semibold text-black transition-transform hover:scale-105 dark:border-slate-800">
                      <ShineBorder
                        borderWidth={2}
                        duration={12}
                        shineColor={["#f97316", "#fb923c", "#f97316"]}
                        className="rounded-[inherit]"
                      />
                      <span className="relative z-10 flex w-full items-center justify-between gap-4 px-1">
                        <span className="w-full">{primaryCtaLabel}</span>
                        <span className="flex min-h-8 min-w-8 items-center justify-center rounded-full bg-black text-white">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </span>
                    </span>
                  </Link>
                </div>
              </div>

              <div className="border-foreground/10 bg-foreground/5 relative min-h-[300px] overflow-hidden rounded-3xl border p-6 backdrop-blur-sm">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Code2 className="h-64 w-64" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="text-sm font-medium">From the dev:</div>
                  <blockquote className="border-l-2 border-orange-500 pl-4 italic text-muted-foreground">
                    "Making a Discord bot in Node.js was one of the first projects that made me feel like a real developer. I've been working on this platform in some form for 10 years. Now, I want to offer a good product that is inexpensive and helps us all make money."
                  </blockquote>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
