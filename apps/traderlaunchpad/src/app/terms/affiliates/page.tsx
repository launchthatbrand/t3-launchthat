import Link from "next/link";

export default function AffiliateTermsPage() {
  return (
    <div className="container py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Affiliate Terms &amp; Conditions</h1>
        <p className="text-muted-foreground text-sm">
          These terms govern participation in the TraderLaunchpad affiliate program.
        </p>
      </div>

      <div className="space-y-4 text-sm leading-6">
        <div>
          <div className="font-semibold">1. Program eligibility</div>
          <div className="text-muted-foreground">
            You must have an active TraderLaunchpad account to participate.
          </div>
        </div>

        <div>
          <div className="font-semibold">2. No harassment / no direct outreach</div>
          <div className="text-muted-foreground">
            You may not use referral information to identify, contact, or harass referred users.
            TraderLaunchpad intentionally does not expose referred users’ emails to affiliates.
          </div>
        </div>

        <div>
          <div className="font-semibold">3. Attribution</div>
          <div className="text-muted-foreground">
            Attribution is time-limited and may expire. Self-referrals are not allowed.
          </div>
        </div>

        <div>
          <div className="font-semibold">4. Rewards</div>
          <div className="text-muted-foreground">
            Rewards and benefits are granted automatically based on activation and paid conversion
            rules and may change over time.
          </div>
        </div>

        <div>
          <div className="font-semibold">5. Termination</div>
          <div className="text-muted-foreground">
            TraderLaunchpad may disable an affiliate profile for policy violations or abuse.
          </div>
        </div>
      </div>

      <div className="text-muted-foreground text-xs">
        Version: v1 · <Link className="underline underline-offset-4" href="/terms">All terms</Link>
      </div>
    </div>
  );
}

