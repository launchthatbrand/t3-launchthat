import { createMediaItem } from "./createMediaItem";
import { createPost } from "./createPost";

// Export action types for external use
export type { ActionDefinition } from "@acme/integration-sdk";

export const WordPressActions = {
  create_post: createPost,
  create_media_item: createMediaItem,
} as const;
