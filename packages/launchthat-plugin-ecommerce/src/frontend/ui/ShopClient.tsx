"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import Link from "next/link";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

const apiAny = api as any;

type ProductRow = {
  post?: { _id: string; title?: string; slug?: string } | null;
  price?: number | null;
  priceText?: string | null;
  pricingKind?: "one_time" | "subscription_monthly";
};

const formatMoney = (amount: number): string => `$${amount.toFixed(2)}`;

export function ShopClient({ organizationId }: { organizationId?: string }) {
  const products = useQuery(
    apiAny.plugins.commerce.products.queries.listProducts,
    {
      organizationId,
      limit: 50,
    },
  ) as unknown;

  const isLoading = products === undefined;
  const rows: Array<ProductRow> = Array.isArray(products)
    ? (products as any[])
    : [];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {isLoading ? (
        <>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={`skeleton-${idx}`}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </>
      ) : rows.length === 0 ? (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>No products</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            There are no published products yet.
          </CardContent>
        </Card>
      ) : null}

      {rows.map((row) => {
        const post = row.post ?? null;
        const title = typeof post?.title === "string" ? post.title : "Product";
        const slug = typeof post?.slug === "string" ? post.slug : "";
        const price =
          typeof row.price === "number" && Number.isFinite(row.price)
            ? row.price
            : null;
        const priceText =
          typeof row.priceText === "string" && row.priceText.trim()
            ? row.priceText
            : null;
        const pricingKind = row.pricingKind;

        // Best-effort link: products generally live under /products/<slug>.
        const href = slug ? `/product/${slug}` : "#";

        return (
          <Card key={post?._id ?? `${title}-${href}`}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">{title}</CardTitle>
              <div className="text-muted-foreground text-sm">
                {priceText
                  ? priceText
                  : price === null
                    ? "Price not set"
                    : pricingKind === "subscription_monthly"
                      ? `${formatMoney(price)}/mo`
                      : formatMoney(price)}
              </div>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant="outline"
                className="w-full"
                disabled={!slug}
              >
                <Link href={href}>View</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
