"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "launchthat-plugin-commerce/components";

type ProductRow = {
  post: {
    _id: string;
    title: string;
    slug: string;
    featuredImageUrl?: string;
  };
  price: number | null;
};

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

export default function StoreFrontPage() {
  const rowsRaw = useQuery(api.plugins.commerce.products.queries.listProducts, {
    limit: 50,
  }) as unknown;

  const rows: Array<ProductRow> = Array.isArray(rowsRaw)
    ? (rowsRaw as Array<any>)
        .map((r) => ({
          post: r?.post,
          price: typeof r?.price === "number" ? r.price : null,
        }))
        .filter((r) => r?.post?._id && r?.post?.slug)
    : [];

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-3xl font-bold">Store</h1>
        <p className="text-muted-foreground text-sm">
          {rows.length} product{rows.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.post._id}
            className="bg-card rounded-lg border p-4 shadow-sm"
          >
            <Link href={`/store/product/${row.post._id}`} className="block">
              <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-md">
                {row.post.featuredImageUrl ? (
                  <Image
                    src={row.post.featuredImageUrl}
                    alt={row.post.title}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="mt-3">
                <div className="line-clamp-2 text-base font-semibold">
                  {row.post.title}
                </div>
                <div className="text-muted-foreground mt-1 text-sm">
                  {row.price != null ? formatPrice(row.price) : "—"}
                </div>
              </div>
            </Link>

            <div className="mt-4 flex justify-end">
              <AddToCartButton productId={row.post._id} showIcon />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


