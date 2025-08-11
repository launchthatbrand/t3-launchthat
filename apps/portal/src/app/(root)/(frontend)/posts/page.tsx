"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { EntityList } from "~/components/shared/EntityList/EntityList";

type Post = Doc<"posts">;

export default function BlogPage() {
  const posts = useQuery(api.core.posts.queries.getAllPosts, {
    filters: { status: "published", limit: 50 },
  });

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
    <div className="container py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Blog</CardTitle>
          <Button asChild>
            <Link href="/admin/posts/create">Create Post</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <EntityList
            data={posts}
            columns={columns}
            isLoading={posts === undefined}
            title="Posts"
            emptyState={
              <div className="flex h-48 flex-col items-center justify-center p-4 text-center">
                <p className="mb-2 text-lg font-medium">No posts yet</p>
                <p className="text-sm text-muted-foreground">
                  Check back later.
                </p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
