"use client";

// Remove Tanstack Query imports
// import {
//   useMutation,
//   useQueryClient,
//   useSuspenseQuery,
// } from "@tanstack/react-query";
import type { Doc, Id } from "convex/_generated/dataModel"; // Import Doc type
import type {
  ApiFromModules,
  FunctionReference,
  OptionalRestArgs,
} from "convex/server";
import { api as generatedApi } from "@convex-config/_generated/api";
// Import Convex hooks and generated API
import { useMutation, useQuery } from "convex/react";

// Keep schema and UI imports
import { CreatePostSchema } from "@acme/db/schema";
import { cn } from "@acme/ui";
// Import helper type
import { Button } from "@acme/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  useForm,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

// Remove tRPC import
// import { useTRPC } from "~/trpc/react";

// Cast the imported api to the correct type
const api = generatedApi as ApiFromModules<typeof generatedApi._modules>;

export function CreatePostForm() {
  // Remove trpc setup
  // const trpc = useTRPC();
  const form = useForm({
    schema: CreatePostSchema,
    defaultValues: {
      content: "",
      title: "",
    },
  });

  // Remove Tanstack Query client
  // const queryClient = useQueryClient();

  // Rely on type inference for the Convex mutation hook
  const createPost = useMutation(api.posts.create);

  return (
    <Form {...form}>
      <form
        className="flex w-full max-w-2xl flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          // Call Convex mutation
          createPost({ title: data.title, content: data.content })
            .then(() => {
              // Handle success: reset form, show toast
              form.reset();
              toast.success("Post created successfully!");
              // Convex handles cache invalidation automatically based on query dependencies
            })
            .catch((err) => {
              // Handle error: show toast
              console.error("Failed to create post:", err);
              // Attempt to provide a more specific error message if possible
              const errorMessage =
                err instanceof Error ? err.message : "Failed to create post";
              toast.error(errorMessage);
              // Consider specific checks, e.g., for Convex authorization errors
              // if (err?.data?.code === "UNAUTHORIZED") { ... }
            });
        })}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Content" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Optionally disable button while submitting */}
        <Button disabled={form.formState.isSubmitting}>Create</Button>
      </form>
    </Form>
  );
}

export function PostList() {
  // Remove trpc setup
  // const trpc = useTRPC();

  // Rely on type inference for the Convex query hook
  const posts = useQuery(api.posts.getAll);

  // Handle loading state (useQuery returns undefined while loading)
  if (posts === undefined) {
    // Should be caught by Suspense, but good practice for initial render
    return (
      <div className="flex w-full flex-col gap-4">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="relative flex w-full flex-col gap-4">
        <PostCardSkeleton pulse={false} />
        <PostCardSkeleton pulse={false} />
        <PostCardSkeleton pulse={false} />

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
          <p className="text-2xl font-bold text-white">No posts yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Linter might still complain about 'p' type, but functionally correct */}
      {posts.map((p) => {
        return <PostCard key={p._id} post={p as Doc<"posts">} />;
      })}
    </div>
  );
}

// Update PostCard props to use Convex Doc type
export function PostCard(props: {
  post: Doc<"posts">; // Use Doc<"tableName"> for Convex documents
}) {
  // Remove trpc setup
  // const trpc = useTRPC();
  // Remove Tanstack query client
  // const queryClient = useQueryClient();

  // Rely on type inference for the Convex mutation hook
  const deletePost = useMutation(api.posts.delete);

  const handleDelete = () => {
    // Call Convex mutation with the document ID
    deletePost({ id: props.post._id })
      .then(() => {
        toast.success("Post deleted");
      })
      .catch((err) => {
        console.error("Failed to delete post:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete post";
        toast.error(errorMessage);
      });
  };

  return (
    <div className="flex flex-row rounded-lg bg-muted p-4">
      <div className="flex-grow">
        {/* Access fields from Convex Doc */}
        <h2 className="text-2xl font-bold text-primary">{props.post.title}</h2>
        <p className="mt-2 text-sm">{props.post.content}</p>
      </div>
      <div>
        <Button
          variant="ghost"
          className="cursor-pointer text-sm font-bold uppercase text-primary hover:bg-transparent hover:text-white"
          onClick={handleDelete} // Call the delete handler
          // Optionally disable while deleting
          // disabled={deletePost.isLoading} // Convex useMutation doesn't expose isLoading directly
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

// PostCardSkeleton remains the same as it's pure UI
export function PostCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props;
  return (
    <div className="flex flex-row rounded-lg bg-muted p-4">
      <div className="flex-grow">
        <h2
          className={cn(
            "w-1/4 rounded bg-primary text-2xl font-bold",
            pulse && "animate-pulse",
          )}
        >
          &nbsp;
        </h2>
        <p
          className={cn(
            "mt-2 w-1/3 rounded bg-current text-sm",
            pulse && "animate-pulse",
          )}
        >
          &nbsp;
        </p>
      </div>
    </div>
  );
}
