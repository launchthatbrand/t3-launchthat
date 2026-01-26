"use client";

import { Card, cn } from "@acme/ui";

import { AffiliateStars } from "./AffiliateStars";
import { Button } from "@acme/ui/button";
import type { DemoAffiliateLink } from "@acme/demo-data";
import Link from "next/link";
import React from "react";

const kindToPath = (kind: DemoAffiliateLink["kind"]) =>
  kind === "broker" ? "/broker" : "/firm";

interface AffiliateCta {
  label: string;
  href: string;
  external?: boolean;
}

export const AffiliateCard = ({
  item,
  className,
  titleHref,
  primaryCta,
  secondaryCta,
}: {
  item: DemoAffiliateLink;
  className?: string;
  titleHref?: string;
  primaryCta?: AffiliateCta;
  secondaryCta?: AffiliateCta;
}) => {
  const detailsHref = titleHref ?? `${kindToPath(item.kind)}/${item.slug}`;
  const primary: AffiliateCta = primaryCta ?? {
    label: "View details",
    href: detailsHref,
  };
  const secondary: AffiliateCta = secondaryCta ?? {
    label: "Use affiliate link",
    href: item.affiliateUrl,
    external: true,
  };

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-white/6 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm">
            {item.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.logoUrl}
                alt={item.name}
                className="h-full w-full object-cover opacity-95"
              />
            ) : (
              <div className="text-sm font-bold">
                {item.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <Link
                href={detailsHref}
                className="min-w-0 flex-1 truncate text-base font-semibold dark:text-white text-black underline-offset-4 hover:underline"
              >
                {item.name}
              </Link>
              <AffiliateStars
                rating={item.rating}
                reviewCount={item.reviewCount}
                className="shrink-0"
              />
            </div>
            <div className="mt-1 line-clamp-2 text-sm leading-6 text-foreground/60">
              {item.tagline}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.badges.slice(0, 3).map((b) => (
            <span
              key={b}
              className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium dark:text-orange-200 text-black"
            >
              {b}
            </span>
          ))}
          {item.markets.slice(0, 3).map((m) => (
            <span
              key={m}
              className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-medium dark:text-white text-black backdrop-blur-sm"
            >
              {m}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-full border-white/15 bg-white/5 px-4 text-sm dark:text-white text-black hover:bg-white/10 hover:text-white"
            >
              {primary.external ? (
                <a
                  href={primary.href}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                >
                  {primary.label}
                </a>
              ) : (
                <Link href={primary.href}>{primary.label}</Link>
              )}
            </Button>

            {secondary.external ? (
              <a
                href={secondary.href}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="text-sm font-medium text-orange-200/90 underline-offset-4 hover:underline"
              >
                {secondary.label}
              </a>
            ) : (
              <Link
                href={secondary.href}
                className="text-sm font-medium text-orange-200/90 underline-offset-4 hover:underline"
              >
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

