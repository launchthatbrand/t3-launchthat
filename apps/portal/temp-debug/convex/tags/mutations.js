import { ConvexError, v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../lib/permissions/requirePermission";
/**
 * Create a new global tag.
 */
export const createTag = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
    },
    returns: v.id("tags"),
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const baseSlug = args.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
        let slug = baseSlug;
        let existingTag = await ctx.db
            .query("tags")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .unique();
        let suffix = 1;
        while (existingTag) {
            slug = `${baseSlug}-${suffix}`;
            existingTag = await ctx.db
                .query("tags")
                .withIndex("by_slug", (q) => q.eq("slug", slug))
                .unique();
            suffix++;
        }
        const tagId = await ctx.db.insert("tags", {
            name: args.name,
            slug,
            description: args.description,
        });
        return tagId;
    },
});
/**
 * Update an existing global tag.
 */
export const updateTag = mutation({
    args: {
        id: v.id("tags"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const { id, name, description } = args;
        const tag = await ctx.db.get(id);
        if (!tag) {
            throw new ConvexError("Tag not found");
        }
        let slug = tag.slug; // Default to current slug
        if (name && name !== tag.name) {
            const baseSlug = name
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");
            let newSlug = baseSlug;
            let existingTag = await ctx.db
                .query("tags")
                .withIndex("by_slug", (q) => q.eq("slug", newSlug))
                .unique();
            let suffix = 1;
            while (existingTag && existingTag._id !== id) {
                newSlug = `${baseSlug}-${suffix}`;
                existingTag = await ctx.db
                    .query("tags")
                    .withIndex("by_slug", (q) => q.eq("slug", newSlug))
                    .unique();
                suffix++;
            }
            slug = newSlug;
        }
        await ctx.db.patch(id, {
            name: name ?? tag.name,
            slug,
            description: description ?? tag.description,
        });
        return null;
    },
});
/**
 * Delete a global tag.
 */
export const deleteTag = mutation({
    args: {
        id: v.id("tags"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const { id } = args;
        const tag = await ctx.db.get(id);
        if (!tag) {
            throw new ConvexError("Tag not found");
        }
        // Before deleting the tag, optionally remove its ID from any documents that reference it
        // This is a crucial step to maintain data integrity.
        // Example: Update courses, lessons, and topics to remove this tagId
        const courses = await ctx.db.query("courses").collect();
        for (const course of courses) {
            if (course.tagIds?.includes(id)) {
                await ctx.db.patch(course._id, {
                    tagIds: course.tagIds.filter((tagId) => tagId !== id),
                });
            }
        }
        const lessons = await ctx.db.query("lessons").collect();
        for (const lesson of lessons) {
            if (lesson.tagIds?.includes(id)) {
                await ctx.db.patch(lesson._id, {
                    tagIds: lesson.tagIds.filter((tagId) => tagId !== id),
                });
            }
        }
        const topics = await ctx.db.query("topics").collect();
        for (const topic of topics) {
            if (topic.tagIds?.includes(id)) {
                await ctx.db.patch(topic._id, {
                    tagIds: topic.tagIds.filter((tagId) => tagId !== id),
                });
            }
        }
        // Finally, delete the tag itself
        await ctx.db.delete(id);
        return null;
    },
});
