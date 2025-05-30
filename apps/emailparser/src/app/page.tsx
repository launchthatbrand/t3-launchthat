import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { AuthShowcase } from "./_components/auth-showcase";
import { EmailContent } from "./_components/EmailContent";
import { EmailSidebar } from "./_components/EmailSidebar";
import { FieldsSidebar } from "./_components/FieldsSidebar";
import {
  CreatePostForm,
  PostCardSkeleton,
  PostList,
} from "./_components/posts";

export default function HomePage() {
  prefetch(trpc.post.all.queryOptions());

  return (
    <HydrateClient>
      <div className="flex h-screen">
        <EmailSidebar />
        <EmailContent />
        <FieldsSidebar />
      </div>
    </HydrateClient>
  );
}
