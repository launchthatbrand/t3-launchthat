import type { Doc, Id } from "@/convex/_generated/dataModel";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { fetchQuery as convexFetchQuery } from "convex/nextjs";

type FetchQuery = typeof convexFetchQuery;
type QueryRef = Parameters<FetchQuery>[0];
type FetchQueryRest =
  Parameters<FetchQuery> extends [unknown, ...infer R] ? R : [];

type PostTypeDoc = Doc<"postTypes">;

const LMS_ARCHIVE_SLUGS = new Set([
  "courses",
  "lessons",
  "topics",
  "quizzes",
  "certificates",
]);

export async function resolveFrontendArchive<
  TCoreQuery extends QueryRef,
  TLmsQuery extends QueryRef,
  TListEntitiesQuery extends QueryRef,
>(args: {
  postType: PostTypeDoc;
  organizationId: Id<"organizations"> | null;
  fetchQuery: FetchQuery;

  getAllPostsCore: TCoreQuery;
  getAllPostsLms: TLmsQuery;
  listEntities: TListEntitiesQuery;
}): Promise<{ posts: Doc<"posts">[] }> {
  const archiveSlug = args.postType.slug.toLowerCase();

  const callFetchQuery = async <TResult>(
    query: QueryRef,
    params: unknown,
  ): Promise<TResult> => {
    return (await args.fetchQuery(
      query,
      ...([params] as unknown as FetchQueryRest),
    )) as TResult;
  };

  // Custom-table downloads archive: /downloads
  if (archiveSlug === "downloads" && args.postType.storageKind === "custom") {
    if (!args.organizationId) return { posts: [] };

    const raw = await callFetchQuery<unknown>(args.listEntities, {
      postTypeSlug: "downloads",
      organizationId: String(args.organizationId),
      filters: { status: "published", limit: 50 },
    });

    const rows: unknown[] = Array.isArray(raw) ? raw : [];

    const posts: Doc<"posts">[] = rows.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const entity = row as Record<string, unknown>;

      const id = typeof entity.id === "string" ? entity.id : "";
      if (!id) return [];

      const slug = typeof entity.slug === "string" ? entity.slug : "";
      const title = typeof entity.title === "string" ? entity.title : null;
      const excerpt =
        typeof entity.excerpt === "string" ? entity.excerpt : null;
      const content =
        typeof entity.content === "string" ? entity.content : null;
      const createdAt =
        typeof entity.createdAt === "number" ? entity.createdAt : Date.now();
      const updatedAt =
        typeof entity.updatedAt === "number" ? entity.updatedAt : createdAt;

      return [
        {
          _id: `custom:downloads:${id}`,
          _creationTime: createdAt,
          organizationId: args.organizationId,
          postTypeSlug: "downloads",
          slug,
          title: title ?? "Download",
          excerpt: excerpt ?? undefined,
          content: content ?? "",
          status: "published",
          createdAt,
          updatedAt,
        } as unknown as Doc<"posts">,
      ];
    });

    return { posts };
  }

  const isLmsComponentArchive =
    LMS_ARCHIVE_SLUGS.has(archiveSlug) ||
    (args.postType.storageKind === "component" &&
      (args.postType.storageTables ?? []).some((table) =>
        table.includes("launchthat_lms:posts"),
      ));

  const posts = isLmsComponentArchive
    ? await callFetchQuery<Doc<"posts">[] | null>(args.getAllPostsLms, {
        organizationId: args.organizationId ?? undefined,
        filters: {
          status: "published",
          postTypeSlug: args.postType.slug,
          limit: 50,
        },
      })
    : await callFetchQuery<Doc<"posts">[] | null>(args.getAllPostsCore, {
        ...(args.organizationId ? { organizationId: args.organizationId } : {}),
        filters: {
          status: "published",
          postTypeSlug: args.postType.slug,
          limit: 50,
        },
      });

  return { posts: posts ?? [] };
}
