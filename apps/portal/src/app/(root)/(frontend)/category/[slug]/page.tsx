"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatPostDate } from "@/lib/blog";
import { Calendar, ChevronLeft, User } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";

// Define the PostItem component to handle individual posts
const PostItem = ({ post }: any) => {
  if (!post || !post._id) return null;

  return (
    <Link href={`/social/post/${post._id}`} key={post._id}>
      <Card className="overflow-hidden transition-all hover:bg-accent/5">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <div className="relative h-48 w-full md:h-auto md:w-1/3">
              {post.featuredImageUrl ? (
                <Image
                  src={post.featuredImageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
            </div>
            <div className="flex-1 p-6">
              <h2 className="mb-2 text-xl font-semibold">{post.title}</h2>
              <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatPostDate(post.createdAt)}</span>
                </div>
                {post.author && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{post.author.name}</span>
                  </div>
                )}
              </div>
              <p className="line-clamp-3 text-muted-foreground">
                {post.excerpt ||
                  post.content.replace(/<[^>]*>/g, "").substring(0, 150) +
                    "..."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.slug as string;
  const [categoryName, setCategoryName] = useState<string>("");

  // Format the category slug for display
  useEffect(() => {
    if (categorySlug) {
      // Convert slug to readable format (e.g., "tips-tuesday" to "Tips Tuesday")
      const formatted = categorySlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      setCategoryName(formatted);
    }
  }, [categorySlug]);

  // Get posts filtered by the category
  const { data, isLoading } = useAllPosts({
    status: "published",
    category: categoryName, // Use the formatted category name
  });

  const posts = data?.posts || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/category">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-4xl font-bold capitalize">
            {categoryName || categorySlug}
          </h1>
        </div>

        <Separator className="mb-8" />

        {isLoading ? (
          // Loading state
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative h-48 w-full md:h-auto md:w-1/3">
                      <Skeleton className="h-full w-full" />
                    </div>
                    <div className="flex-1 p-6">
                      <Skeleton className="mb-2 h-6 w-3/4" />
                      <div className="mb-4 flex gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="mb-2 h-4 w-full" />
                      <Skeleton className="mb-2 h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <PostItem key={post?._id || index} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="mb-2 text-xl font-medium">No posts found</h3>
            <p className="text-muted-foreground">
              There are no published posts in this category yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
