"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { AddToCartButton } from "launchthat-plugin-commerce/components";

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

export default function ProductPage() {
  const params = useParams();
  const productId = params.productId as string;

  const product = useQuery(
    api.plugins.commerce.products.queries.getProductById,
    {
      postId: productId,
    },
  ) as unknown;

  if (product === undefined) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">Loading…</div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="mb-4 text-sm text-gray-600">Product not found.</p>
        <Link href="/store" className="text-sm font-medium underline">
          Back to store
        </Link>
      </div>
    );
  }

  const post = (product as any).post as {
    _id: string;
    title: string;
    featuredImageUrl?: string;
  };
  const price = (product as any).price as number | null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/store" className="text-sm font-medium underline">
          Back to store
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-muted relative aspect-square overflow-hidden rounded-lg">
          {post.featuredImageUrl ? (
            <Image
              src={post.featuredImageUrl}
              alt={post.title}
              fill
              className="object-cover"
            />
          ) : null}
        </div>

        <div>
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <div className="text-muted-foreground mt-2 text-lg">
            {price != null ? formatPrice(price) : "—"}
          </div>

          <div className="mt-6">
            <AddToCartButton productId={post._id} />
          </div>
        </div>
      </div>
    </div>
  );
}
