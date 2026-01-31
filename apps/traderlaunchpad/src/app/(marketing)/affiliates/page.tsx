import Link from "next/link";
import { cookies } from "next/headers";
import { TENANT_SESSION_COOKIE_NAME } from "launchthat-plugin-core-tenant/next/tenant-session";
import { ArrowRight, BadgeDollarSign, BarChart3, Link2, Sparkles, Users, Wallet } from "lucide-react";

import { Card, ShineBorder } from "@acme/ui";

const formatUsd = (cents: number): string => {
  const v = Math.round(cents) / 100;
  return `$${v.toFixed(2)}`;
};

export default async function AffiliatesMarketingPage() {
  const cookieStore = await cookies();
  const hasTenantSession = Boolean(cookieStore.get(TENANT_SESSION_COOKIE_NAME)?.value);
  const primaryCtaHref = hasTenantSession ? "/admin/affiliates/share" : "/sign-in";
  const primaryCtaLabel = hasTenantSession ? "Open Share Kit" : "Get Started";

  // Example numbers used in the copy (marketing page, not binding logic).
  const proPriceCents = 4999;
  const proCommissionRate = 0.2;
  const threeProMonthlyCents = Math.round(3 * proPriceCents * proCommissionRate);
  const fiveProMonthlyCents = Math.round(5 * proPriceCents * proCommissionRate);

  const widgetSnippet = [
    `<script type="module" src="https://traderlaunchpad.com/widgets/tdrlp-widgets.es.js"></script>`,
    `<tdrlp-economic-calendar`,
    `  api-base="https://YOUR-CONVEX-DEPLOYMENT.convex.site"`,
    `  news-base="https://traderlaunchpad.com/news/forex/calendar?ref=YOUR_CODE&utm_source=affiliate&utm_medium=widget&utm_campaign=affiliate&utm_content=economic_calendar"`,
    `  preset="thisWeek"`,
    `></tdrlp-economic-calendar>`,
  ].join("\n");

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
              <span className="relative z-10">Affiliate program</span>
            </div>

            <h1 className="mx-auto mt-6 max-w-5xl text-5xl leading-[0.95] font-bold tracking-tight md:text-7xl lg:text-8xl">
              Earn credit.
              <span className="block leading-none">Cover your subscription.</span>
            </h1>

            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-sm font-medium tracking-normal md:text-lg">
              Or get paid out beyond your plan.
            </p>

            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-center text-lg font-medium md:text-xl">
              Share TraderLaunchpad with your community. Earn affiliate credit on paid conversions you bring in—and
              choose whether to apply it to your subscription or receive payouts.
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
                href="/terms/affiliates"
                className="border-foreground/20 text-foreground hover:bg-foreground/5 inline-flex h-12 min-w-[180px] items-center justify-center rounded-[1.75rem] border bg-transparent px-5 font-medium transition"
              >
                View terms
              </Link>
            </div>

            <div className="border-foreground/10 bg-foreground/5 text-foreground/70 mx-auto mt-8 max-w-xl rounded-2xl border p-4 text-sm backdrop-blur-sm">
              <div className="font-medium text-foreground">Goal: 3 paid members → free Pro</div>
              <div className="mt-1 text-muted-foreground">
                Share a few high-performing links, track what converts, and let credit apply automatically.
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm">
                  <BadgeDollarSign className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">Earn on paid conversions</div>
              </div>
              <div className="text-muted-foreground mt-3 text-sm">
                Earn commission credit on payments from users you refer. If they stay subscribed, you keep earning.
              </div>
            </Card>

            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">Cover your plan first</div>
              </div>
              <div className="text-muted-foreground mt-3 text-sm">
                Apply credit to your subscription automatically, then pay out any remainder (optional).
              </div>
            </Card>

            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">Per-link analytics</div>
              </div>
              <div className="text-muted-foreground mt-3 text-sm">
                Create shortlinks with content templates, then track clicks, signups, activations, and earnings.
              </div>
            </Card>
          </div>
        </section>

        <section className="relative container mx-auto mt-16 max-w-7xl px-4 md:mt-24">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold">How it works</div>
            </div>
            <ol className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3">
                <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-border/60 bg-background text-center text-xs font-semibold leading-6">
                  1
                </div>
                <div>
                  <div className="font-medium">Get your referral link</div>
                  <div className="text-muted-foreground">
                    Use the Share Kit to generate shortlinks and copy-paste share templates for X, LinkedIn, SMS, email,
                    and more.
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-border/60 bg-background text-center text-xs font-semibold leading-6">
                  2
                </div>
                <div>
                  <div className="font-medium">People sign up using your link</div>
                  <div className="text-muted-foreground">
                    Your referral code and UTMs are captured and applied to downstream attribution events.
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-border/60 bg-background text-center text-xs font-semibold leading-6">
                  3
                </div>
                <div>
                  <div className="font-medium">Earn credit (and payouts)</div>
                  <div className="text-muted-foreground">
                    Credit accumulates as users convert and renew. You can apply it to your subscription or receive
                    payouts once you’re eligible.
                  </div>
                </div>
              </li>
            </ol>
            <div className="text-muted-foreground mt-6 text-xs">
              Self-referrals are not allowed. Attribution rules may be time-limited.
            </div>
          </Card>

            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold">Example earnings</div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="border-foreground/10 bg-foreground/5 text-foreground/70 rounded-2xl border p-6 text-sm backdrop-blur-sm">
                <div className="text-xs text-muted-foreground">Recruit 3 paying Pro members</div>
                <div className="mt-1 text-lg font-semibold">{formatUsd(threeProMonthlyCents)} / month</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  Roughly equals a Pro subscription on typical pricing (example assumes {Math.round(proCommissionRate * 100)}%
                  on {formatUsd(proPriceCents)}).
                </div>
              </div>
              <div className="border-foreground/10 bg-foreground/5 text-foreground/70 rounded-2xl border p-6 text-sm backdrop-blur-sm">
                <div className="text-xs text-muted-foreground">Recruit 5 paying Pro members</div>
                <div className="mt-1 text-lg font-semibold">{formatUsd(fiveProMonthlyCents)} / month</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  Earn beyond your subscription—credit can be paid out depending on your payout settings.
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/60 bg-background px-3 py-1">
                Commission credit accrues monthly
              </span>
              <span className="rounded-full border border-border/60 bg-background px-3 py-1">
                Optional sponsor network override (if you opt in)
              </span>
            </div>
          </Card>
          </div>
        </section>

        <section className="relative container mx-auto mt-16 max-w-7xl px-4 md:mt-24">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold">Sharable content + shortlinks</div>
            </div>
            <div className="text-muted-foreground mt-3 text-sm">
              Generate a shortlink per post and track performance per template/content. Share from your dashboard and see
              what actually converts.
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href={userId ? "/admin/affiliates/share" : "/sign-in"}
                className="border-foreground/10 bg-foreground/5 text-foreground/90 inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold backdrop-blur-md transition hover:bg-foreground/10"
              >
                Create share link
              </Link>
              <Link
                href={userId ? "/admin/affiliates/analytics" : "/sign-in"}
                className="border-foreground/10 bg-foreground/5 text-foreground/90 inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold backdrop-blur-md transition hover:bg-foreground/10"
              >
                View analytics
              </Link>
            </div>
          </Card>

            <Card className="border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/6 overflow-hidden rounded-3xl border p-8 backdrop-blur-md transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className="border-foreground/10 bg-foreground/5 flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-sm">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold">Embeddable widgets (affiliate-aware)</div>
            </div>
            <div className="text-muted-foreground mt-3 text-sm">
              If you embed TraderLaunchpad widgets on your site, you can attach your affiliate code to widget links so
              signups are attributed back to you.
            </div>

            <pre className="border-foreground/10 bg-foreground/5 text-foreground/70 mt-6 overflow-x-auto rounded-2xl border p-4 text-xs leading-5 backdrop-blur-sm">
              <code>{widgetSnippet}</code>
            </pre>

            <div className="text-muted-foreground mt-3 text-xs">
              Tip: you can change UTMs like <span className="font-mono">utm_content</span> to track which widget or page
              drove the signup.
            </div>
            <div className="mt-4">
              <Link
                href="/widgets"
                className="border-foreground/10 bg-foreground/5 text-foreground/90 inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold backdrop-blur-md transition hover:bg-foreground/10"
              >
                View widget showcase
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
                    <div className="text-sm font-semibold">Can I earn more than my subscription costs?</div>
                    <div className="text-muted-foreground mt-2 text-sm">
                      Yes. Your credit can exceed your plan cost. Depending on your payout settings, you can apply credit
                      to your subscription and pay out the remainder.
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Do I need to sell anything?</div>
                    <div className="text-muted-foreground mt-2 text-sm">
                      No. You just share. TraderLaunchpad handles billing, attribution, and payouts.
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Can I join someone’s network (sponsor)?</div>
                    <div className="text-muted-foreground mt-2 text-sm">
                      You may be prompted to opt in when you sign up through an invite code. This is optional and can
                      increase the sponsor’s earnings on your future affiliate sales.
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Where do I manage everything?</div>
                    <div className="text-muted-foreground mt-2 text-sm">
                      In your affiliate dashboard: Share Kit, Analytics, payouts, downline, and attribution history.
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-foreground/10 bg-foreground/5 text-foreground/70 rounded-3xl border p-8 text-sm backdrop-blur-sm">
                <div className="text-base font-semibold text-foreground">Ready to start?</div>
                <div className="text-muted-foreground mt-2">
                  Build a share link, post it, and track performance per template and shortlink.
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
                    href="/admin/affiliates"
                    className="border-foreground/20 text-foreground hover:bg-foreground/5 inline-flex h-12 w-full items-center justify-center rounded-[1.75rem] border bg-transparent px-5 font-medium transition"
                  >
                    View dashboard
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

