"use client";

import type { GenericId as Id } from "convex/values";
import Link from "next/link";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { BookOpenText, FilePlus2, Loader2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

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
  const articles = queryResult ?? [];

  return (
    <div className="space-y-8 overflow-y-auto p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Helpdesk
          </p>
          <h1 className="text-2xl font-semibold">Helpdesk articles</h1>
          <p className="text-muted-foreground text-sm">
            Curate long-form answers that feed the widget&apos;s helpdesk tab
            and RAG index.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link
              href={`/admin/edit?post_type=${HELP_DESK_POST_TYPE_SLUG}`}
              prefetch={false}
            >
              Manage in editor
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
      </header>

      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading articles…
        </div>
      ) : articles.length === 0 ? (
        <Card className="border-dashed text-center">
          <CardHeader className="space-y-2">
            <BookOpenText className="text-muted-foreground mx-auto h-8 w-8" />
            <CardTitle>No helpdesk articles yet</CardTitle>
            <CardDescription>
              Start by drafting internal FAQs that the assistant can cite or
              show inside the widget.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link
                href={`/admin/edit?post_type=${HELP_DESK_POST_TYPE_SLUG}&post_id=new`}
                prefetch={false}
              >
                Create the first article
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {articles.map((article) => (
            <Card key={article._id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="line-clamp-1">
                    {article.title || "Untitled article"}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">
                    {article.excerpt || "No summary provided."}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    article.status === "published" ? "default" : "secondary"
                  }
                >
                  {article.status ?? "draft"}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  Updated{" "}
                  {formatRelativeTime(article.updatedAt ?? article.createdAt)}
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/admin/edit?post_type=${HELP_DESK_POST_TYPE_SLUG}&post_id=${article._id}`}
                    prefetch={false}
                  >
                    Open
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const formatRelativeTime = (timestamp?: number | null) => {
  if (!timestamp) {
    return "just now";
  }
  const deltaMs = Date.now() - timestamp;
  if (deltaMs < 60_000) return "just now";
  if (deltaMs < 3_600_000) {
    const mins = Math.round(deltaMs / 60_000);
    return `${mins}m ago`;
  }
  if (deltaMs < 86_400_000) {
    const hrs = Math.round(deltaMs / 3_600_000);
    return `${hrs}h ago`;
  }
  const days = Math.round(deltaMs / 86_400_000);
  return `${days}d ago`;
};
