import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Target,
} from "lucide-react";
import { Card, ShineBorder } from "@acme/ui";

import Link from "next/link";
import { cookies } from "next/headers";
import { TENANT_SESSION_COOKIE_NAME } from "launchthat-plugin-core-tenant/next/tenant-session";

export default async function JournalMarketingPage() {
  const hasTenantSession = Boolean(cookies().get(TENANT_SESSION_COOKIE_NAME)?.value);
  const primaryCtaHref = hasTenantSession ? "/admin/journal" : "/sign-in";
  const primaryCtaLabel = hasTenantSession ? "Open Journal" : "Get Started";

  return (
    <div className="text-foreground relative min-h-screen selection:bg-orange-500/30">
      <main className="relative z-10 pt-6">
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
              <span className="relative z-10">Trade journal</span>
            </div>

            <h1 className="mx-auto mt-6 max-w-5xl text-5xl leading-[0.95] font-bold tracking-tight md:text-7xl lg:text-8xl">
              Review your trades.
              <span className="block leading-none">Spot patterns faster.</span>
            </h1>

            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-sm font-medium tracking-normal md:text-lg">
              Turn raw executions into a feedback loop you’ll actually use.
            </p>

            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-center text-lg font-medium md:text-xl">
              Sync your broker, see trades on a calendar, drill into executions, and build consistency with a streak you
              can’t ignore.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
                href={userId ? "/journal/dashboard" : "/sign-in"}
                className="border-foreground/20 text-foreground hover:bg-foreground/5 inline-flex h-12 min-w-[180px] items-center justify-center rounded-[1.75rem] border bg-transparent px-5 font-medium transition"
              >
                Open standalone app
              </Link>
            </div>

            <div className="border-foreground/10 bg-foreground/5 text-foreground/70 mx-auto mt-8 max-w-xl rounded-2xl border p-4 text-sm backdrop-blur-sm">
              <div className="font-medium text-foreground">Built for a daily review workflow</div>
              <div className="mt-1 text-muted-foreground">
                Calendar → trades list → drilldown → patterns by symbol/time → iterate.
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">Calendar view + drilldown</div>
              </div>
              <div className="text-muted-foreground mt-3 text-sm">
                Visualize PnL by day, filter by date, and open trade drilldowns right from the calendar.
              </div>
            </Card>

            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm">
                  <Target className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">By-symbol breakdown</div>
              </div>
              <div className="text-muted-foreground mt-3 text-sm">
                See which instruments you trade most and which are actually paying you. Sort by trades or profitability.
              </div>
            </Card>

            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">Review queue</div>
              </div>
              <div className="text-muted-foreground mt-3 text-sm">
                A fast “recent trades” panel to keep review tight and consistent—then jump into details when needed.
              </div>
            </Card>
          </div>
        </section>

        <section className="relative container mx-auto mt-16 max-w-7xl px-4 md:mt-24">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">What you get today</div>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  "Calendar PnL + trade realization events",
                  "Trade list with filters and quick drilldowns",
                  "Instrument aggregates (Most Traded / Most Profitable)",
                  "Organization totals view (when you’re in org mode)",
                  "Broker sync + background autosync (server-side)",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="text-muted-foreground mt-6 text-xs">
                Some deeper insights (like timing analytics) are actively being built and will unlock as data accrues.
              </div>
            </Card>

            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">How it works</div>
              </div>
              <ol className="mt-4 space-y-3 text-sm">
                <li className="flex gap-3">
                  <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-border/60 bg-background text-center text-xs font-semibold leading-6">
                    1
                  </div>
                  <div>
                    <div className="font-medium">Connect your broker</div>
                    <div className="text-muted-foreground">
                      Link your account so executions and closed trades can be imported automatically.
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-border/60 bg-background text-center text-xs font-semibold leading-6">
                    2
                  </div>
                  <div>
                    <div className="font-medium">Sync + autosync</div>
                    <div className="text-muted-foreground">
                      Imports run in the background on a schedule so your journal stays current with minimal effort.
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-border/60 bg-background text-center text-xs font-semibold leading-6">
                    3
                  </div>
                  <div>
                    <div className="font-medium">Review consistently</div>
                    <div className="text-muted-foreground">
                      Use the calendar and review list to build a daily habit—then improve with symbol/time patterns.
                    </div>
                  </div>
                </li>
              </ol>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryCtaHref}
                  className="border-foreground/10 bg-foreground/5 text-foreground/90 inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold backdrop-blur-md transition hover:bg-foreground/10"
                >
                  {primaryCtaLabel}
                </Link>
                <Link
                  href={userId ? "/admin/orders" : "/sign-in"}
                  className="border-foreground/10 bg-foreground/5 text-foreground/90 inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold backdrop-blur-md transition hover:bg-foreground/10"
                >
                  Review trades
                </Link>
              </div>
            </Card>
          </div>
        </section>

        <section className="relative container mx-auto mt-16 mb-24 max-w-7xl px-4 md:mt-24">
          <Card className="border-foreground/10 bg-foreground/3 relative overflow-hidden rounded-[44px] border p-8 backdrop-blur-md md:p-12">
            <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:gap-12">
              <div>
                <div className="text-sm font-semibold">FAQ</div>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold">Is this a standalone journal or part of the app?</div>
                    <div className="text-muted-foreground mt-2 text-sm">
                      Both. You can use the journal inside the main dashboard, or open the standalone journal route.
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Do I have to manually enter trades?</div>
                    <div className="text-muted-foreground mt-2 text-sm">
                      No—connect your broker and we’ll import executions and keep syncing in the background.
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Can teams track together?</div>
                    <div className="text-muted-foreground mt-2 text-sm">
                      If you’re using organization mode, you can view org totals and aggregated stats.
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Is analytics included?</div>
                    <div className="text-muted-foreground mt-2 text-sm">
                      Yes—deeper analytics are expanding over time as more data is synced and reviewed.
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-foreground/10 bg-foreground/5 text-foreground/70 rounded-3xl border p-8 text-sm backdrop-blur-sm">
                <div className="text-base font-semibold text-foreground">Ready to journal like a pro?</div>
                <div className="text-muted-foreground mt-2">
                  Connect, sync, review, iterate. Keep your edge.
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <Link href={primaryCtaHref} className="inline-block">
                    <span className="relative inline-flex h-12 w-full items-center justify-center rounded-[1.75rem] border border-neutral-200 bg-white px-5 font-medium text-black dark:border-slate-800">
                      <ShineBorder
                        borderWidth={2}
                        duration={12}
                        shineColor={["#f97316", "#fb923c", "#f97316"]}
                        className="rounded-[inherit]"
                      />
                      <span className="relative z-10 inline-flex items-center gap-2">
                        {primaryCtaLabel} <ArrowRight className="h-4 w-4" />
                      </span>
                    </span>
                  </Link>
                  <Link
                    href="/pricing"
                    className="border-foreground/20 text-foreground hover:bg-foreground/5 inline-flex h-12 w-full items-center justify-center rounded-[1.75rem] border bg-transparent px-5 font-medium transition"
                  >
                    View pricing
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

