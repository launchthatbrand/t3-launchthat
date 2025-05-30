"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { GlobalSearchCommand } from "@/components/shared/GlobalSearchCommand";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Edit,
  Eye,
  FileText,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();

  const slug = params.slug as string;
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // Fetch article data from Convex
  const article = useQuery(api.helpdesk.getHelpdeskArticleBySlug, {
    slug,
  });

  // Get mutations
  const deleteArticle = useMutation(api.helpdesk.deleteHelpdeskArticle);
  const incrementViews = useMutation(api.helpdesk.incrementArticleViews);

  // Increment views when the article loads
  useEffect(() => {
    const articleId = article?._id;
    if (articleId) {
      // Don't await this - fire and forget
      incrementViews({ id: articleId }).catch((error) => {
        console.error("Failed to increment view count:", error);
      });
    }
  }, [article?._id, incrementViews]);

  // Handle article deletion
  const handleDeleteArticle = async () => {
    if (!article) return;

    try {
      await deleteArticle({ id: article._id });

      toast.success("Article deleted", {
        description: "The article has been permanently deleted.",
      });

      router.push("/admin/helpdesk");
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Error", {
        description: "Failed to delete the article. Please try again.",
      });
    }
  };

  // Loading state
  if (article === undefined) {
    return (
      <div className="container mx-auto max-w-5xl space-y-6 pb-16">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <Skeleton className="h-10 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div>
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="mt-2 h-6 w-1/3" />
            </div>

            <Skeleton className="h-6 w-40" />

            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (article === null) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-semibold">Article Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The article you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/helpdesk">Back to Helpdesk</Link>
        </Button>
      </div>
    );
  }

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-6 pb-16">
      {/* Article header with search */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/helpdesk">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Helpdesk
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <GlobalSearchCommand
            typeFilters={["helpdesk"]}
            placeholder="Search help articles..."
            className="w-full md:w-64"
          />
          <Button variant="outline" size="icon" title="Share Article">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" asChild title="Edit Article">
            <Link href={`/admin/helpdesk/article/${slug}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive"
                title="Delete Article"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Article</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this article? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteArticle}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Article content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div>
            <h1 className="text-3xl font-bold">{article.title}</h1>
            <p className="mt-2 text-muted-foreground">
              Category: <span className="font-medium">{article.category}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Updated: {formatDate(article.lastUpdated)}</span>
            <Separator orientation="vertical" className="h-4" />
            <Eye className="h-4 w-4" />
            <span>{article.views} views</span>
          </div>

          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Related Articles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {article.relatedArticles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No related articles found.
                </p>
              ) : (
                article.relatedArticles.map((related) => (
                  <Link
                    key={related._id}
                    href={`/admin/helpdesk/article/${related.slug}`}
                    className="flex items-center justify-between rounded-md p-2 hover:bg-accent"
                  >
                    <span className="line-clamp-1 text-sm">
                      {related.title}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/helpdesk">View All Articles</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Author:</span>
                <span>{article.authorName}</span>

                <span className="text-muted-foreground">Created:</span>
                <span>{formatDate(article._creationTime)}</span>

                <span className="text-muted-foreground">Last Updated:</span>
                <span>{formatDate(article.lastUpdated)}</span>

                <span className="text-muted-foreground">Category:</span>
                <span>{article.category}</span>

                <span className="text-muted-foreground">Tags:</span>
                <span>
                  {article.tags.length > 0
                    ? article.tags.join(", ")
                    : "No tags"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
