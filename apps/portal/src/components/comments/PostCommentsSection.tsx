"use client";

import { CommentThread } from "launchthat-plugin-socialfeed/components";

import { MovingBorder } from "~/components/ui/moving-border";
import { PortalConvexProvider } from "~/providers/ConvexClientProvider";
import { PortalSocialFeedProvider } from "~/providers/SocialFeedProvider";

interface PostCommentsSectionProps {
  postId: string;
  organizationId?: string | null;
}

export function PostCommentsSection(props: PostCommentsSectionProps) {
  return (
    <PortalConvexProvider>
      <PortalSocialFeedProvider>
        <PostCommentsSectionInner {...props} />
      </PortalSocialFeedProvider>
    </PortalConvexProvider>
  );
}

function PostCommentsSectionInner({ postId }: PostCommentsSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-transparent p-px shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        // style={{ borderRadius: "calc(var(--radius) * 4)" }}
      >
        <MovingBorder duration={10000} rx="18" ry="18">
          <div className="h-20 w-20 bg-[radial-gradient(#0ea5e9_40%,transparent_60%)] opacity-[0.7]" />
        </MovingBorder>
      </div>

      <div className="bg-card relative overflow-hidden rounded-2xl border p-6">
        <div className="pointer-events-none relative z-10">
          <div className="pointer-events-auto">
            <CommentThread postId={postId} postType="post" initialExpanded />
          </div>
        </div>
      </div>
    </section>
  );
}
