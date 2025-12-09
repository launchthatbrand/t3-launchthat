"use client";

import type { GenericId as Id } from "convex/values";
import { useMemo } from "react";
import Link from "next/link";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { FilePlus2 } from "lucide-react";

import type { ColumnDefinition } from "@acme/ui/entity-list";
import { Button } from "@acme/ui/button";
import { Card } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list";

const HELP_DESK_POST_TYPE_SLUG = "helpdeskarticles";

type SupportArticle = {
  _id: string;
  title?: string | null;
  excerpt?: string | null;
  status?: "draft" | "published" | "archived";
  slug?: string | null;
  updatedAt?: number | null;
  createdAt?: number | null;
};

interface ArticlesViewProps {
  organizationId: Id<"organizations">;
}

export const ArticlesView = ({ organizationId }: ArticlesViewProps) => {
  const queryResult = useQuery(api.core.posts.queries.getAllPosts, {
    organizationId,
    filters: { postTypeSlug: HELP_DESK_POST_TYPE_SLUG },
  }) as SupportArticle[] | undefined;
  const isLoading = queryResult === undefined;

  const rows = useMemo(
    () =>
      (queryResult ?? []).map((article) => ({
        id: article._id,
        title: article.title || "Untitled article",
        status: article.status ?? "draft",
        updatedAt: article.updatedAt ?? article.createdAt ?? Date.now(),
      })),
    [queryResult],
  );

  const columns = useMemo<ColumnDefinition<(typeof rows)[number]>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        cell: (row: (typeof rows)[number]) => (
          <Link
            href={`/admin/edit?post_type=${HELP_DESK_POST_TYPE_SLUG}&post_id=${row.id}`}
            prefetch={false}
            className="font-medium hover:underline"
          >
            {row.title}
          </Link>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: (row: (typeof rows)[number]) => (
          <span className="text-sm capitalize">{row.status}</span>
        ),
      },
      {
        id: "updatedAt",
        header: "Updated",
        cell: (row: (typeof rows)[number]) => (
          <span className="text-muted-foreground text-sm">
            {formatDistanceToNow(row.updatedAt, { addSuffix: true })}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Helpdesk
            </p>
            <h1 className="text-2xl font-semibold">Helpdesk articles</h1>
            <p className="text-muted-foreground text-sm">
              Manage the knowledge base entries surfaced inside the support
              widget.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link
                href={`/admin/edit?post_type=${HELP_DESK_POST_TYPE_SLUG}`}
                prefetch={false}
              >
                Open editor
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link
                href={`/admin/edit?post_type=${HELP_DESK_POST_TYPE_SLUG}&post_id=new`}
                prefetch={false}
              >
                <FilePlus2 className="h-4 w-4" />
                New article
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Card className="overflow-hidden border-0 shadow-none">
          <EntityList
            data={rows}
            columns={columns}
            isLoading={isLoading}
            enableFooter={false}
            enableSearch
            defaultViewMode="list"
            viewModes={["list"]}
            onRowClick={(row) => {
              window.location.href = `/admin/edit?post_type=${HELP_DESK_POST_TYPE_SLUG}&post_id=${row.id}`;
            }}
            emptyState={
              <div className="text-muted-foreground py-10 text-center text-sm">
                No helpdesk articles yet. Click “New article” to create your
                first entry.
              </div>
            }
          />
        </Card>
      </div>
    </div>
  );
};
