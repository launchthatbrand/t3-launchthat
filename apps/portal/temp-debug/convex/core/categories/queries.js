import { query } from "../../_generated/server";
/**
 * Get all post categories
 */
export const getPostCategories = query({
    args: {},
    handler: async (ctx) => {
        // Query all posts to get categories
        const posts = await ctx.db.query("posts").collect();
        // Count posts by category
        const categoryMap = {};
        for (const post of posts) {
            const category = post.category ?? "Uncategorized";
            categoryMap[category] = (categoryMap[category] ?? 0) + 1;
        }
        // Convert to array of category objects
        const categories = Object.entries(categoryMap).map(([name, count]) => ({
            name,
            count,
        }));
        // Sort alphabetically by name
        return categories.sort((a, b) => a.name.localeCompare(b.name));
    },
});
