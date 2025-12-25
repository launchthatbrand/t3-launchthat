import type { Doc, Id } from "@/convex/_generated/dataModel";

import { resolveDownloadPost } from "./resolvers/downloads";

type FetchQuery = <TArgs extends Record<string, any>, TResult>(
  fn: any,
  args: TArgs,
) => Promise<TResult>;

export async function resolveFrontendEntry(args: {
  segments: string[];
  slug: string;
  organizationId: Id<"organizations"> | null;
  fetchQuery: FetchQuery;
  readEntity: unknown;
  listEntities: unknown;
}): Promise<{ post: Doc<"posts"> } | null> {
  const downloadPost = await resolveDownloadPost(args);
  if (downloadPost) return { post: downloadPost };

  return null;
}


