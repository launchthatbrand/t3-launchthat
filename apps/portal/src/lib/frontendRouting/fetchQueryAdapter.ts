import type { fetchQuery as convexFetchQuery } from "convex/nextjs";

export type FetchQueryLike = <TResult>(fn: unknown, args: unknown) => Promise<TResult>;

/**
 * Adapt Convex `fetchQuery` to a lightweight, resolver-friendly signature.
 * This avoids leaking `FunctionReference` generics into routing modules and
 * keeps resolver code testable without Convex types.
 */
export function adaptFetchQuery(fetchQuery: typeof convexFetchQuery): FetchQueryLike {
  return (async (fn: unknown, args: unknown) => {
    // The Convex `fetchQuery` type is stricter than what our resolver layer needs.
    // We intentionally treat `fn` and `args` as `unknown` at this boundary.
    return (await (fetchQuery as unknown as (q: unknown, a: unknown) => Promise<unknown>)(
      fn,
      args,
    ));
  }) as FetchQueryLike;
}


