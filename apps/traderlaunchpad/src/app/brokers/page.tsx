import { AffiliateCard } from "../../components/affiliates/AffiliateCard";
import { AffiliatePageShell } from "../../components/affiliates/AffiliatePageShell";
import { Marquee } from "@acme/ui/marquee";
import React from "react";
import { demoBrokers } from "@acme/demo-data";

export default function BrokersArchivePage() {
  const topRated = [...demoBrokers]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  return (
    <AffiliatePageShell
      title="Top brokers"
      subtitle="Pick a broker, grab your affiliate link, and route traders to the best fit for their market + platform."
    >
      <div className="mb-10 overflow-hidden rounded-3xl border border-white/10 bg-black/30 py-4 backdrop-blur-md">
        <div className="px-6 pb-3 text-sm font-medium text-white/70">
          Top rated brokers
        </div>
        <Marquee className="[--duration:42s] [--gap:2.5rem]" repeat={3}>
          {topRated.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 rounded-full border border-white/10 bg-white/3 px-3 py-2 text-sm text-white/80 backdrop-blur-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.logoUrl ?? ""}
                alt={b.name}
                className="h-6 w-6 rounded-full border border-white/10 bg-black/30"
              />
              <span className="font-semibold">{b.name}</span>
              <span className="text-xs text-white/40">{b.rating.toFixed(1)}</span>
            </div>
          ))}
        </Marquee>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {demoBrokers.map((b) => (
          <AffiliateCard key={b.id} item={b} />
        ))}
      </div>

      <div className="h-24" />
    </AffiliatePageShell>
  );
}

