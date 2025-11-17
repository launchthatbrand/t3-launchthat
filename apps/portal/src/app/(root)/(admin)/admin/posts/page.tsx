"use client";

import type { FilterConfig } from "@/components/shared/EntityList/EntityList";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import { Suspense, useState } from "react";
import Link from "next/link";
import { EntityList } from "@/components/shared/EntityList/EntityList";
import { api } from "@/convex/_generated/api";
import {
  formatPostDate,
  useBulkUpdatePostStatus,
  useDeletePost,
} from "@/lib/blog";
import { useQuery } from "convex/react";
import {
  ChevronDown,
  Edit,
  Eye,
  FilePlus,
  MoreHorizontal,
  Trash,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";

import type { PostStatus } from "~/components/admin/PostStatusForm";

// Map status to badge variants
const statusVariantMap: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  published: "default",
  draft: "secondary",
  archived: "outline",
};

type Post = Doc<"posts">;

function PostsAdminPageBody() {
  const [selectedPosts, setSelectedPosts] = useState<Id<"posts">[]>([]);
  const [activeFilters, setActiveFilters] = useState({});

  const postsData = useQuery(api.core.posts.queries.getAllPosts, {});

  console.log("postsData", postsData);

  // Get posts data from Convex
  // const { data: postsData, isLoading: isPostsLoading } = useAllPosts();
  const categoriesData = useQuery(api.core.posts.queries.getPostCategories, {});
  const updatePostsStatus = useBulkUpdatePostStatus();
  const deletePost = useDeletePost();

  // Get unique categories from the data
  const categoriesRaw = categoriesData ?? [];
  const categoryOptions = categoriesRaw
    .map((item) => {
      const name =
        typeof item === "string"
          ? item
          : ((item as { name?: string }).name ?? "");
      return name ? { label: name, value: name } : null;
    })
    .filter((o): o is { label: string; value: string } => o !== null);

  // Map raw posts to Post type
  // const posts = postsData?.posts
  //   ? postsData.posts.map((rawPost: any): Post => {
  //       if (!rawPost) return {} as Post; // Handle null case

  //       // Determine status - if missing or invalid, use "draft" as default
  //       let status: PostStatus = "draft";
  //       if (
  //         rawPost.status &&
  //         ["draft", "published", "archived"].includes(rawPost.status)
  //       ) {
  //         status = rawPost.status as PostStatus;
  //       }

  //       return {
  //         _id: rawPost._id,
  //         _creationTime: rawPost._creationTime,
  //         title: rawPost.title,
  //         content: rawPost.content,
  //         status,
  //         category: rawPost.category ?? "Uncategorized",
  //         slug: rawPost.slug ?? "",
  //         createdAt: rawPost.createdAt ?? rawPost._creationTime,
  //         excerpt: rawPost.excerpt,
  //         tags: rawPost.tags ?? [],
  //         authorId: rawPost.authorId,
  //         updatedAt: rawPost.updatedAt,
  //         featuredImageUrl: rawPost.featuredImageUrl,
  //         featured: rawPost.featured ?? false,
  //         readTime: rawPost.readTime,
  //         author: rawPost.author,
  //       };
  //     })
  //   : [];

  const handleBulkAction = async (status: PostStatus) => {
    if (selectedPosts.length === 0) return;
    await updatePostsStatus({ ids: selectedPosts, status });
    setSelectedPosts([]);
  };

  const handleDeletePost = async (postId: Id<"posts">) => {
    await deletePost({ id: postId });
  };

  // Define columns for EntityList
  const columns: ColumnDef<Post>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      cell: ({ row }) => {
        const post = row.original;
        return (
          <Link
            href={`/admin/posts/${post._id}`}
            className="font-mono text-sm font-medium text-blue-600 hover:underline"
          >
            {post.title}
          </Link>
        );
      },
      enableSorting: true,
    },
    {
      id: "author",
      header: "Author",
      accessorKey: "author",
      cell: ({ row }) => {
        const post = row.original;
        return <div>{post.authorId ?? "Unknown"}</div>;
      },
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      cell: ({ row }) => {
        const post = row.original;
        return <Badge variant="outline">{post.category}</Badge>;
      },
    },
    {
      id: "date",
      header: "Date",
      accessorKey: "createdAt",
      cell: ({ row }) => {
        const post = row.original;
        return <div>{formatPostDate(post.createdAt)}</div>;
      },
      enableSorting: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const post = row.original;
        const status = post.status ?? "draft";
        const pretty = status.length
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "Draft";
        return (
          <Badge variant={statusVariantMap[status] ?? "secondary"}>
            {pretty}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/posts/${post._id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDeletePost(post._id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Define filters for EntityList
  const filters: FilterConfig<Post>[] = [
    {
      id: "status",
      label: "Status",
      type: "select",
      field: "status",
      options: [
        { label: "All Statuses", value: "all" },
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
        { label: "Archived", value: "archived" },
      ],
    },
    {
      id: "category",
      label: "Category",
      type: "select",
      field: "category",
      options: [
        { label: "All Categories", value: "all" },
        ...(categoryOptions.length > 0 ? categoryOptions : []),
      ],
    },
  ];

  // Define bulk actions for the header
  const headerActions =
    selectedPosts.length > 0 ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Bulk Actions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            Selected {selectedPosts.length} posts
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleBulkAction("published")}>
            Publish Selected
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleBulkAction("draft")}>
            Move to Drafts
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleBulkAction("archived")}>
            Archive Selected
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            Delete Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button asChild>
        <Link href="/admin/posts/create">
          <FilePlus className="mr-2 h-4 w-4" />
          Create Post
        </Link>
      </Button>
    );

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <p className="text-muted-foreground">Manage and create blog content</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Posts</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <Link href="/admin/posts/category">Manage Categories</Link>
              </Button>
              {headerActions}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EntityList
            data={postsData ?? []}
            columns={columns}
            filters={filters}
            isLoading={postsData === undefined}
            title="Posts"
            initialFilters={activeFilters}
            onFiltersChange={setActiveFilters}
            emptyState={
              <div className="flex h-48 flex-col items-center justify-center p-4 text-center">
                <p className="mb-2 text-lg font-medium">No posts found</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Create your first blog post to get started
                </p>
                <Button asChild>
                  <Link href="/admin/posts/create">
                    <FilePlus className="mr-2 h-4 w-4" />
                    Create Post
                  </Link>
                </Button>
              </div>
            }
          />
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          {/* <div className="text-sm text-muted-foreground">
            Showing {posts.length} of{" "}
            {postsData?.posts ? postsData.posts.length : 0} posts
          </div> */}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PostsAdminPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading posts…</div>}>
      <PostsAdminPageBody />
    </Suspense>
  );
}
