import type { useAction, useMutation, useQuery } from "convex/react";

export interface VimeoHookBag {
  useQuery: typeof useQuery;
  useMutation?: typeof useMutation;
  useAction?: typeof useAction;
}
