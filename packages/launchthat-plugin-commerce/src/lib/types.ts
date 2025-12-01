"use client";

import type { GenericId } from "convex/values";

/**
 * Minimal Convex Id helper so the commerce plugin can refer to document ids
 * without depending on a host app's generated types.
 */
export type Id<TableName extends string = string> = GenericId<TableName>;

/**
 * Lightweight Doc helper that preserves the `_id` shape while allowing any
 * additional fields. This keeps type checking flexible when the host app
 * provides richer schemas.
 */
export type Doc<TableName extends string = string> = {
  _id: Id<TableName>;
  [key: string]: unknown;
};
