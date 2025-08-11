import { v } from "convex/values";
// Validator for pagination options
export const paginationOptsValidator = v.object({
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    numItems: v.optional(v.number()),
});
