import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { DEFAULT_PAGE_SIZE } from "./constants"; // Assuming a default page size constant

/**
 * Re-export Convex's pagination options validator for convenience
 */
export { paginationOptsValidator };

/**
 * Validator for standard pagination options in queries.
 * Uses a default number of items if not specified.
 */
export const defaultPaginationOptsValidator = {
  paginationOpts: paginationOptsValidator, // Re-exporting Convex's validator
};

/**
 * Returns pagination options with a default number of items.
 * If numItems is provided in opts, it will be used; otherwise, DEFAULT_PAGE_SIZE is used.
 *
 * @param opts - Optional pagination arguments, potentially including numItems and cursor.
 * @returns Standard pagination options object for use with .paginate().
 */
export const getDefaultPaginationOpts = (opts?: {
  numItems?: number;
  cursor?: string | null;
}) => {
  return {
    numItems: opts?.numItems ?? DEFAULT_PAGE_SIZE,
    cursor: opts?.cursor ?? null,
  };
};

/**
 * Type for the result of a paginated query using the standard pagination options.
 */
export interface PaginatedResults<T> {
  page: T[];
  isDone: boolean;
  continueCursor: string;
}

// Example of a more specific pagination validator if needed:
export const customPaginationArgs = {
  numItems: v.optional(v.number()), // Allow overriding default
  cursor: v.optional(v.string()),
  // You could add other filter args specific to a query type here
};

export const getCustomPaginationOpts = (args: {
  numItems?: number | undefined;
  cursor?: string | null | undefined;
}) => {
  return {
    numItems: args.numItems ?? DEFAULT_PAGE_SIZE,
    cursor: args.cursor ?? null,
  };
};
