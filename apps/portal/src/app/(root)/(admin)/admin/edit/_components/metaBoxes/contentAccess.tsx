import { registerMetaBoxHook } from "@acme/admin-runtime";

import type { AdminMetaBoxContext } from "../types";
import { ContentAccess } from "~/components/admin/ContentAccess";

export const registerContentAccessMetaBox: () => void = () => {
  registerMetaBoxHook<AdminMetaBoxContext>("sidebar", (context) => {
    const postId = context.post?._id ? String(context.post._id) : null;
    if (!postId) return null;

    const postTypeSlug = context.slug;
    const title =
      typeof context.post?.title === "string" ? context.post.title : undefined;

    return {
      id: "core-content-access",
      title: "Content Access",
      description:
        "Control who can access this content on the frontend (tags, roles, permissions).",
      location: "sidebar",
      priority: 60,
      render: () => (
        <ContentAccess
          contentType="post"
          contentId={postId}
          postTypeSlug={postTypeSlug ?? "post"}
          title={title ?? postTypeSlug}
        />
      ),
    };
  });
};


