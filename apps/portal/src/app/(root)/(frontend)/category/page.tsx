"use client";

import React from "react";
import Link from "next/link";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";
import { useTenant } from "~/context/TenantContext";

export default function CategoriesPage() {
  const tenant = useTenant();
  const categories = useQuery(
    api.core.posts.queries.getPostCategories,
    tenant?._id ? { organizationId: tenant._id } : {},
  );
  const isLoading = categories === undefined;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-4xl font-bold">Blog Categories</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Browse blog posts by category
        </p>

        <Separator className="mb-8" />

        {isLoading ? (
          // Loading state
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-7 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="mb-2 h-4 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories?.map((category) => (
              <Link
                key={category.name}
                href={`/category/${encodeURIComponent(
                  category.name.toLowerCase(),
                )}`}
              >
                <Card className="h-full overflow-hidden transition-all hover:bg-accent/5">
                  <CardHeader className="pb-2">
                    <CardTitle>{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {category.count} {category.count === 1 ? "post" : "posts"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
