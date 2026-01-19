import { AffiliateCard } from "~/components/affiliates/AffiliateCard";
import { AffiliatePageShell } from "~/components/affiliates/AffiliatePageShell";
import { Marquee } from "@acme/ui/marquee";
import React from "react";
import { demoPropFirms } from "@acme/demo-data";
import Link from "next/link";

export default function FirmsArchivePage() {
  const topRated = [...demoPropFirms]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  return (
    <AffiliatePageShell
      title="Top prop firms"
      subtitle="Compare rules and programs, then share affiliate links you trust. (Always verify current terms on the firm’s site.)"
    >
      <div className="mb-10 overflow-hidden rounded-3xl border border-white/10 bg-black/30 py-4 backdrop-blur-md">
        <div className="px-6 pb-3 text-sm font-medium text-white/70">
          Top rated prop firms
        </div>
        <Marquee className="[--duration:44s] [--gap:2.5rem]" repeat={3}>
          {topRated.map((f) => (
            <Link key={f.id} href={`/firm/${f.slug}`}>
            <div
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/3 px-3 py-2 text-sm text-white/80 backdrop-blur-md transition-colors hover:bg-white/10 cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.logoUrl ?? ""}
                alt={f.name}
                className="h-6 w-6 rounded-full border border-white/10 bg-black/30"
              />
              <span className="font-semibold">{f.name}</span>
              <span className="text-xs text-white/40">{f.rating.toFixed(1)}</span>
            </div>
            </Link>
          ))}
        </Marquee>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {demoPropFirms.map((f) => (
          <AffiliateCard key={f.id} item={f} />
        ))}
      </div>

      <div className="h-24" />
    </AffiliatePageShell>
  );
}

