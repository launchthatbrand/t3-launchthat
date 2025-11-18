"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import {
  FrontendSinglePostHeader,
  FrontendSinglePostLayout,
  FrontendSinglePostMain,
  FrontendSinglePostSidebar,
} from "~/components/frontend/FrontendSinglePostLayout";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

type Post = Doc<"posts">;

export default function BlogPage() {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const posts = useQuery(
    api.core.posts.queries.getAllPosts,
    organizationId
      ? {
          organizationId,
          filters: { status: "published", limit: 50 },
        }
      : { filters: { status: "published", limit: 50 } },
  );

  const columns: ColumnDef<Post>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-col">
            <Link
              href={`/posts/${p._id}`}
              className="font-medium hover:underline"
            >
              {p.title}
            </Link>
            {p.excerpt && (
              <div className="text-sm text-muted-foreground">
                {p.excerpt.length > 80
                  ? `${p.excerpt.slice(0, 80)}…`
                  : p.excerpt}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.category ?? "Uncategorized"}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge>{(row.original.status ?? "draft").toString()}</Badge>
      ),
    },
  ];

  return (
    <>
      <FrontendSinglePostHeader
        title="Blog"
        subtitle="Read our latest blog posts"
        backHref="/posts"
        breadcrumbs={["Blog"]}
        author={undefined}
        className="bg-primary/30"
      />
      <FrontendSinglePostLayout className="gap-20">
        {/* <FrontendSinglePostSidebar></FrontendSinglePostSidebar> */}
        <FrontendSinglePostMain className="w-full">
          {/* <Card> */}
          {/* <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Blog</CardTitle>
              <Button asChild>
                <Link href="/admin/posts/create">Create Post</Link>
              </Button>
            </CardHeader> */}
          {/* <CardContent className="p-5"> */}
          <EntityList
            data={posts}
            columns={columns}
            isLoading={posts === undefined}
            viewModes={[]}
            defaultViewMode="grid"
            emptyState={
              <div className="flex h-48 flex-col items-center justify-center p-4 text-center">
                <p className="mb-2 text-lg font-medium">No posts yet</p>
                <p className="text-sm text-muted-foreground">
                  Check back later.
                </p>
              </div>
            }
          />
          {/* </CardContent> */}
          {/* </Card> */}
        </FrontendSinglePostMain>
      </FrontendSinglePostLayout>
    </>
  );
}
