import { Suspense } from "react";

// Remove tRPC imports
// import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { AuthShowcase } from "./_components/auth-showcase";
import {
  CreatePostForm,
  PostCardSkeleton,
  PostList,
} from "./_components/posts";

export default function HomePage() {
  // Remove tRPC prefetch call
  // prefetch(trpc.post.all.queryOptions());

  return (
    // Remove HydrateClient wrapper
    // <HydrateClient>
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-primary">T3</span> Turbo
        </h1>
        <AuthShowcase />

        {/* TODO: Refactor CreatePostForm to use Convex useMutation */}
        <CreatePostForm />
        <div className="w-full max-w-2xl overflow-y-scroll">
          <Suspense
            fallback={
              <div className="flex w-full flex-col gap-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            }
          >
            {/* TODO: Refactor PostList to use Convex useQuery */}
            <PostList />
          </Suspense>
        </div>
      </div>
    </main>
    // </HydrateClient>
  );
}
