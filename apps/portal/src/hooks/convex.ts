// eslint-disable-next-line
import { useMutation, useQuery } from "convex/react";

/**
 * Wrapper around Convex's useQuery hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useConvexQuery = useQuery;

/**
 * Wrapper around Convex's useMutation hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useConvexMutation = useMutation;
