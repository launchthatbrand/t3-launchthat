"use client";

import { AffiliateStars } from "./AffiliateStars";
import { Button } from "@acme/ui/button";
import type { DemoAffiliateLink } from "@acme/demo-data";
import Link from "next/link";
import React from "react";
import { cn } from "@acme/ui";

const kindToPath = (kind: DemoAffiliateLink["kind"]) =>
  kind === "broker" ? "/broker" : "/firm";

export const AffiliateCard = ({
  item,
  className,
}: {
  item: DemoAffiliateLink;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-white/6 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm">
          {item.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.logoUrl}
              alt={item.name}
              className="h-full w-full object-cover opacity-95"
            />
          ) : (
            <div className="text-sm font-bold text-white/80">
              {item.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="truncate text-base font-semibold text-white">
              {item.name}
            </div>
            <AffiliateStars
              rating={item.rating}
              reviewCount={item.reviewCount}
              className="ml-auto"
            />
          </div>
          <div className="mt-1 text-sm text-white/60">{item.tagline}</div>

          <div className="mt-3 flex flex-wrap gap-2">
            {item.badges.slice(0, 3).map((b) => (
              <span
                key={b}
                className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-200"
              >
                {b}
              </span>
            ))}
            {item.markets.slice(0, 3).map((m) => (
              <span
                key={m}
                className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-medium text-white/65 backdrop-blur-sm"
              >
                {m}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-full border-white/15 bg-transparent px-4 text-sm text-white hover:bg-white/10 hover:text-white"
            >
              <Link href={`${kindToPath(item.kind)}/${item.slug}`}>
                View details
              </Link>
            </Button>
            <Link
              href={item.affiliateUrl}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-sm font-medium text-orange-200/90 underline-offset-4 hover:underline"
            >
              Use affiliate link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

