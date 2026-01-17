import { ArrowLeft, ExternalLink } from "lucide-react";

import { AffiliatePageShell } from "../../../components/affiliates/AffiliatePageShell";
import { AffiliateStars } from "../../../components/affiliates/AffiliateStars";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";
import { demoPropFirms } from "@acme/demo-data";
import { notFound } from "next/navigation";

export default async function FirmDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const firm = demoPropFirms.find((f) => f.slug === slug);
  if (!firm) return notFound();

  return (
    <AffiliatePageShell title={firm.name} subtitle={firm.tagline}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          <Link href="/firms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All prop firms
          </Link>
        </Button>

        <div className="ml-auto flex items-center gap-3">
          <AffiliateStars rating={firm.rating} reviewCount={firm.reviewCount} />
          <Link
            href={firm.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            Website <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-8 backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={firm.logoUrl ?? ""}
                  alt={firm.name}
                  className="h-full w-full object-cover opacity-95"
                />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold text-white">{firm.name}</div>
                <div className="mt-1 text-sm text-white/60">{firm.tagline}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {firm.badges.map((b) => (
                    <span
                      key={b}
                      className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-200"
                    >
                      {b}
                    </span>
                  ))}
                  {firm.markets.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-white/10 bg-white/3 px-2.5 py-1 text-[11px] font-medium text-white/65"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {firm.pricingNote ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/3 p-4 text-sm text-white/70">
                <span className="font-semibold text-white/80">Pricing:</span>{" "}
                {firm.pricingNote}
              </div>
            ) : null}

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                <div className="text-sm font-semibold text-white/80">
                  Highlights
                </div>
                <ul className="mt-3 space-y-2 text-sm text-white/65">
                  {firm.highlights.slice(0, 6).map((h) => (
                    <li key={h}>• {h}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                <div className="text-sm font-semibold text-white/80">Notes</div>
                <ul className="mt-3 space-y-2 text-sm text-white/65">
                  {firm.pros.slice(0, 3).map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                  {firm.cons.slice(0, 3).map((c) => (
                    <li key={c} className="text-white/55">
                      • {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md">
            <div className="text-sm font-semibold text-white/80">
              Affiliate link
            </div>
            <div className="mt-2 text-sm text-white/60">
              Use this link to track referrals. Replace `example.com` with your
              real affiliate URLs.
            </div>
            <div className="mt-5">
              <Button
                asChild
                className="h-11 w-full rounded-full bg-white text-black hover:bg-gray-100"
              >
                <Link
                  href={firm.affiliateUrl}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                >
                  Open affiliate link
                </Link>
              </Button>
            </div>
            <div className="mt-3 text-xs text-white/45">
              Always verify current rules/fees on the provider site.
            </div>
          </div>
        </div>
      </div>

      <div className="h-24" />
    </AffiliatePageShell>
  );
}

