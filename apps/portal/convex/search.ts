import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

// Define a common interface for search results
export const searchResultItemValidator = v.object({
  _id: v.string(), // Using string for ID to accommodate different table IDs
  type: v.string(), // e.g., "post", "event", "download", "product"
  title: v.string(),
  description: v.optional(v.string()),
  url: v.string(), // URL to the item
  score: v.optional(v.number()), // Relevance score from search
  imageUrl: v.optional(v.string()), // Optional image URL
  creatorName: v.optional(v.string()), // Optional creator name
  createdAt: v.optional(v.number()), // Optional creation time
});

// Define a more specific type for items we'll be working with internally
// This helps avoid 'any' and provides better type safety.
interface SearchableItem {
  _id: string; // Changed from Id<string> to string for simplicity in this internal interface
  _creationTime: number;
  type?: string; // Make type optional here, will be added during mapping
  score?: number;
  name?: string;
  title?: string;
  content?: string;
  description?: string;
  shortDescription?: string;
  searchText?: string;
  visibility?: string;
  deleted?: boolean;
  isVisible?: boolean;
  status?: string;
  creatorId?: Id<"users">;
  createdBy?: Id<"users">;
  mediaUrls?: string[];
  slug?: string;
  previewImageUrl?: string;
  thumbnailUrl?: string;
  summary?: string;
  images?: { url: string; alt?: string }[];
  author?: Id<"users">;
  authorName?: string;
}

export const globalSearch = query({
  args: {
    searchText: v.string(),
    typeFilters: v.optional(v.array(v.string())), // e.g., ["post", "event"]
    limit: v.optional(v.number()),
  },
  returns: v.array(searchResultItemValidator),
  handler: async (ctx, args) => {
    const { searchText, typeFilters, limit = 20 } = args;
    const allResults: SearchableItem[] = [];

    if (!searchText) {
      return [];
    }

    console.log(
      `[globalSearch] Searching for: "${searchText}", filters: ${typeFilters?.join(
        ", ",
      )}, limit: ${limit}`,
    );

    // 1. Feed Items (Posts)
    if (!typeFilters || typeFilters.includes("post")) {
      const posts = (await ctx.db
        .query("feedItems")
        .withSearchIndex("search_content", (q) =>
          q.search("content", searchText),
        )
        .filter((q) => q.eq(q.field("visibility"), "public"))
        .filter((q) => q.neq(q.field("deleted"), true))
        .take(limit)) as unknown as SearchableItem[]; // Use unknown for broader initial assertion
      allResults.push(
        ...posts.map((p) => ({ ...p, type: "post" }) as SearchableItem),
      );
    }

    // 2. Events
    if (!typeFilters || typeFilters.includes("event")) {
      const eventsByTitle = (await ctx.db
        .query("events")
        .withSearchIndex("search_title", (q) => q.search("title", searchText))
        .filter((q) => q.eq(q.field("visibility"), "public"))
        .take(limit)) as unknown as SearchableItem[];
      allResults.push(
        ...eventsByTitle.map(
          (e) => ({ ...e, type: "event" }) as SearchableItem,
        ),
      );

      const eventsByDescription = (await ctx.db
        .query("events")
        .withSearchIndex("search_description", (q) =>
          q.search("description", searchText),
        )
        .filter((q) => q.eq(q.field("visibility"), "public"))
        .take(limit)) as unknown as SearchableItem[];
      allResults.push(
        ...eventsByDescription.map(
          (e) => ({ ...e, type: "event" }) as SearchableItem,
        ),
      );
    }

    // 3. Downloads
    if (!typeFilters || typeFilters.includes("download")) {
      const downloads = (await ctx.db
        .query("downloads")
        .withSearchIndex("search_downloads", (q) =>
          q.search("searchText", searchText),
        )
        .take(limit)) as unknown as SearchableItem[];
      allResults.push(
        ...downloads.map((d) => ({ ...d, type: "download" }) as SearchableItem),
      );
    }

    // 4. Products
    if (!typeFilters || typeFilters.includes("product")) {
      const productsByName = (await ctx.db
        .query("products")
        .withSearchIndex("search_products_name", (q) =>
          q.search("name", searchText),
        )
        .filter((q) => q.eq(q.field("isVisible"), true))
        .filter((q) => q.eq(q.field("status"), "published"))
        .take(limit)) as unknown as SearchableItem[];
      allResults.push(
        ...productsByName.map(
          (p) => ({ ...p, type: "product" }) as SearchableItem,
        ),
      );

      const productsByDescription = (await ctx.db
        .query("products")
        .withSearchIndex("search_products_description", (q) =>
          q.search("description", searchText),
        )
        .filter((q) => q.eq(q.field("isVisible"), true))
        .filter((q) => q.eq(q.field("status"), "published"))
        .take(limit)) as unknown as SearchableItem[];
      allResults.push(
        ...productsByDescription.map(
          (p) => ({ ...p, type: "product" }) as SearchableItem,
        ),
      );
    }

    // 5. Helpdesk Articles
    if (!typeFilters || typeFilters.includes("helpdesk")) {
      const helpdeskByTitle = (await ctx.db
        .query("helpdeskArticles")
        .withSearchIndex("search_title", (q) => q.search("title", searchText))
        .filter((q) => q.eq(q.field("published"), true))
        .take(limit)) as unknown as SearchableItem[];
      allResults.push(
        ...helpdeskByTitle.map(
          (h) => ({ ...h, type: "helpdesk" }) as SearchableItem,
        ),
      );

      const helpdeskByContent = (await ctx.db
        .query("helpdeskArticles")
        .withSearchIndex("search_content", (q) =>
          q.search("content", searchText),
        )
        .filter((q) => q.eq(q.field("published"), true))
        .take(limit)) as unknown as SearchableItem[];
      allResults.push(
        ...helpdeskByContent.map(
          (h) => ({ ...h, type: "helpdesk" }) as SearchableItem,
        ),
      );
    }

    // Deduplicate results based on _id and type
    const uniqueResultsMap = new Map<string, SearchableItem>();
    for (const item of allResults) {
      if (item.type) {
        const key = `${item.type}:${item._id}`;
        const existing = uniqueResultsMap.get(key);
        if (
          !existing ||
          (item.score && (!existing.score || item.score > existing.score))
        ) {
          uniqueResultsMap.set(key, item);
        }
      }
    }
    const uniqueResults = Array.from(uniqueResultsMap.values());

    uniqueResults.sort((a, b) => {
      if (a.score && b.score) {
        return b.score - a.score;
      }
      if (!a.score && b.score) {
        return 1;
      }
      if (a.score && !b.score) {
        return -1;
      }
      if (a._creationTime && b._creationTime) {
        return b._creationTime - a._creationTime;
      }
      return (a.name ?? a.title ?? "").localeCompare(b.name ?? b.title ?? "");
    });

    // Map to the final format and fetch additional data
    const formattedResults = await Promise.all(
      uniqueResults.slice(0, limit).map(async (item) => {
        let creatorName: string | undefined;
        let imageUrl: string | undefined;
        let itemUrl: string;
        let description =
          item.description ??
          item.shortDescription ??
          item.content ??
          item.summary;

        const creatorIdentifier =
          item.creatorId ?? item.createdBy ?? item.author;
        if (creatorIdentifier) {
          try {
            const creator = await ctx.db.get(creatorIdentifier);
            creatorName = creator?.name ?? item.authorName;
          } catch (e) {
            console.warn(
              `Failed to fetch creator for ${item.type ?? "unknown_type"} ${item._id}:`,
              e,
            );
            // Use authorName as fallback if available
            creatorName = item.authorName;
          }
        }

        const itemType = item.type ?? "unknown";

        switch (itemType) {
          case "post":
            itemUrl = `/social/post/${item._id}`;
            imageUrl = item.mediaUrls?.[0];
            break;
          case "event":
            itemUrl = `/calendar/event/${item.slug ?? item._id}`;
            break;
          case "download":
            itemUrl = `/downloads/${item.slug ?? item._id}`;
            imageUrl = item.previewImageUrl ?? item.thumbnailUrl;
            description = item.summary ?? description;
            break;
          case "product":
            itemUrl = `/store/product/${item.slug ?? item._id}`;
            imageUrl = item.images?.[0]?.url;
            break;
          case "helpdesk":
            itemUrl = `/helpdesk/article/${item.slug ?? item._id}`;
            description = item.summary ?? description;
            break;
          default:
            itemUrl = "/";
        }

        return {
          _id: item._id.toString(),
          type: itemType,
          title: item.name ?? item.title ?? "Untitled",
          description:
            description?.substring(0, 150) +
            (description && description.length > 150 ? "..." : ""),
          url: itemUrl,
          score: item.score,
          imageUrl,
          creatorName,
          createdAt: item._creationTime,
        };
      }),
    );

    return formattedResults;
  },
});
