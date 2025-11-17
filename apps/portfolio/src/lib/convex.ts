import { api } from "@/convex/_generated/api";
import { env } from "@/src/env";
import { ConvexHttpClient } from "convex/browser";

/**
 * Get a Convex HTTP client for server-side data fetching
 */
export function getConvex() {
  return new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
}
