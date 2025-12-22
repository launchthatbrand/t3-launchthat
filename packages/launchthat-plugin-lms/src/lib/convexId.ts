import type { GenericId } from "convex/values";

// NOTE: This `Id` is for app-scoped Convex tables (e.g. `organizations`, `users`).
// Component-scoped LMS post IDs use plain strings; see `LmsPostId` in `src/types.ts`.
export type Id<TableName extends string = string> = GenericId<TableName>;
