import type {
  useAction,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";

export interface VimeoHookBag {
  useQuery: typeof useQuery;
  useMutation?: typeof useMutation;
  useAction?: typeof useAction;
  usePaginatedQuery?: typeof usePaginatedQuery;
  // Opaque Convex FunctionReference for listing Vimeo videos (portal provides this).
  listVideosQuery?: unknown;
}
