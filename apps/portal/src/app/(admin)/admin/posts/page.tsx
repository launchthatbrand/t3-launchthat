"use client";

import type {
  ColumnDefinition,
  FilterConfig,
} from "@/components/shared/EntityList/EntityList";
import { useState } from "react";
import Link from "next/link";
import { EntityList } from "@/components/shared/EntityList/EntityList";
import { Id } from "@/convex/_generated/dataModel";
import {
  formatPostDate,
  Post,
  PostStatus,
  useAllPosts,
  useBulkUpdatePostStatus,
  useDeletePost,
  usePostCategories,
} from "@/lib/blog";
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

// Map status to badge variants
const statusVariantMap: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  published: "default",
  draft: "secondary",
  archived: "outline",
};

// Define a type for raw posts from the database
interface RawPost {
  _id: Id<"posts">;
  _creationTime: number;
  title: string;
  content: string;
  status?: string;
  category?: string;
  slug?: string;
  createdAt?: number;
  excerpt?: string;
  tags?: string[];
  authorId?: Id<"users">;
  updatedAt?: number;
  featuredImageUrl?: string;
  featured?: boolean;
  readTime?: string;
  author?: {
    _id: Id<"users">;
    name: string;
    imageUrl?: string;
  };
}

function PostsAdminPage() {
  const [selectedPosts, setSelectedPosts] = useState<Id<"posts">[]>([]);
  const [activeFilters, setActiveFilters] = useState({});

  // Get posts data from Convex
  const { data: postsData, isLoading: isPostsLoading } = useAllPosts();
  const { data: categoriesData } = usePostCategories();
  const updatePostsStatus = useBulkUpdatePostStatus();
  const deletePost = useDeletePost();

  // Get unique categories from the data
  const categories = categoriesData?.map((category) => category.name) ?? [];

  // Map raw posts to Post type
  const posts = postsData?.posts
    ? postsData.posts.map((rawPost: any): Post => {
        if (!rawPost) return {} as Post; // Handle null case

        // Determine status - if missing or invalid, use "draft" as default
        let status: PostStatus = "draft";
        if (
          rawPost.status &&
          ["draft", "published", "archived"].includes(rawPost.status)
        ) {
          status = rawPost.status as PostStatus;
        }

        return {
          _id: rawPost._id,
          _creationTime: rawPost._creationTime,
          title: rawPost.title,
          content: rawPost.content,
          status,
          category: rawPost.category ?? "Uncategorized",
          slug: rawPost.slug ?? "",
          createdAt: rawPost.createdAt ?? rawPost._creationTime,
          excerpt: rawPost.excerpt,
          tags: rawPost.tags ?? [],
          authorId: rawPost.authorId,
          updatedAt: rawPost.updatedAt,
          featuredImageUrl: rawPost.featuredImageUrl,
          featured: rawPost.featured ?? false,
          readTime: rawPost.readTime,
          author: rawPost.author,
        };
      })
    : [];

  const handleBulkAction = async (status: PostStatus) => {
    if (selectedPosts.length === 0) return;
    await updatePostsStatus({ ids: selectedPosts, status });
    setSelectedPosts([]);
  };

  const handleDeletePost = async (postId: Id<"posts">) => {
    await deletePost({ id: postId });
  };

  // Define columns for EntityList
  const columns: ColumnDefinition<Post>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      cell: (post) => (
        <div className="flex flex-col">
          <div className="font-medium">{post.title}</div>
          <div className="hidden text-sm text-muted-foreground sm:block">
            {post.excerpt &&
              (post.excerpt.length > 60
                ? `${post.excerpt.substring(0, 60)}...`
                : post.excerpt)}
          </div>
          {post.featured && (
            <Badge className="mt-1 w-fit" variant="outline">
              Featured
            </Badge>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      id: "author",
      header: "Author",
      accessorKey: "author",
      cell: (post) => <div>{post.author?.name ?? "Unknown"}</div>,
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      cell: (post) => <Badge variant="outline">{post.category}</Badge>,
    },
    {
      id: "date",
      header: "Date",
      accessorKey: "createdAt",
      cell: (post) => formatPostDate(post.createdAt),
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (post) => (
        <Badge variant={statusVariantMap[post.status] ?? "secondary"}>
          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (post) => (
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
      ),
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
        ...categories.map((category) => ({
          label: category,
          value: category,
        })),
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
            data={posts}
            columns={columns}
            filters={filters}
            isLoading={isPostsLoading}
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
          <div className="text-sm text-muted-foreground">
            Showing {posts.length} of{" "}
            {postsData?.posts ? postsData.posts.length : 0} posts
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default PostsAdminPage;
