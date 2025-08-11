/**
 * Generate a URL-friendly slug from a string
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/&/g, "-and-") // Replace & with 'and'
        .replace(/[^\w-]+/g, "") // Remove all non-word characters except dashes
        .replace(/--+/g, "-") // Replace multiple - with single -
        .replace(/^-+/, "") // Trim - from start of text
        .replace(/-+$/, ""); // Trim - from end of text
}
/**
 * Truncate a slug if it exceeds the maximum length
 * @param slug The slug to truncate
 * @param maxLength Maximum length for the slug
 * @returns Truncated slug
 */
export function truncateSlug(slug, maxLength = 200) {
    if (slug.length <= maxLength) {
        return slug;
    }
    return slug.substring(0, maxLength);
}
/**
 * Generate a unique slug for an entity
 * @param db Convex database reader
 * @param tableName The table to check for slug uniqueness
 * @param baseSlug The initial slug to use as a base
 * @param entityId Optional ID of the current entity (to exclude from uniqueness check)
 * @returns A unique slug
 */
export async function generateUniqueSlug(db, tableName, baseSlug, entityId) {
    // Generate the initial slug
    let slug = truncateSlug(generateSlug(baseSlug));
    // Attempt to check if the table has a slug field by checking a sample record
    try {
        const sampleRecord = await db.query(tableName).first();
        if (!sampleRecord || !("slug" in sampleRecord)) {
            console.warn(`Table ${tableName} does not appear to have a slug field. Using slug "${slug}" without uniqueness check.`);
            return slug;
        }
    }
    catch {
        // If there's an error accessing the table, return the generated slug
        console.warn(`Unable to verify slug field for table ${tableName}. Using slug "${slug}" without uniqueness check.`);
        return slug;
    }
    // Check if this slug already exists in the table
    let isUnique = false;
    let suffix = 1;
    // Use filter approach to check for uniqueness
    while (!isUnique) {
        try {
            // Query all documents with this slug
            const existingEntities = await db
                .query(tableName)
                .filter((q) => q.eq(q.field("slug"), slug))
                .collect();
            // Check if any entity with this slug exists (except the one we're updating)
            const slugExists = existingEntities.some((entity) => entityId === undefined || entity._id !== entityId);
            if (!slugExists) {
                isUnique = true;
            }
            else {
                // Increment suffix and generate a new slug
                suffix++;
                const suffixStr = `-${suffix}`;
                slug = truncateSlug(slug, 200 - suffixStr.length) + suffixStr;
            }
        }
        catch (e) {
            // If there's an error, we can't check - return the slug as is
            console.error(`Error checking slug uniqueness for ${String(tableName)}: ${String(e)}`);
            return slug;
        }
    }
    return slug;
}
/**
 * Sanitize and validate a manually entered slug
 * @param slug The user-provided slug
 * @returns Sanitized slug
 */
export function sanitizeSlug(slug) {
    // Start by applying the same formatting as generateSlug
    let sanitized = generateSlug(slug);
    // Additional validation specific to manually entered slugs
    // Remove any potentially problematic patterns
    sanitized = sanitized
        .replace(/^(embed|feed|feeds)$/, "$1-1") // Reserved words
        .replace(/^\d+$/, "n$&"); // Prevent slugs that are only numbers
    return sanitized || "untitled"; // Fallback if slug is empty after sanitization
}
/**
 * Check if a slug is reserved and should not be used
 * @param slug The slug to check
 * @returns True if the slug is reserved
 */
export function isReservedSlug(slug) {
    // Common reserved words for web applications
    const reservedSlugs = [
        "admin",
        "wp-admin",
        "login",
        "logout",
        "register",
        "signup",
        "signin",
        "signout",
        "api",
        "embed",
        "settings",
        "profile",
        "dashboard",
        "account",
        "wp-content",
        "feed",
        "rss",
        "json",
        "xml",
        "public",
        "static",
        "media",
        "assets",
        "uploads",
        "files",
        "images",
        "js",
        "css",
        "auth",
    ];
    return reservedSlugs.includes(slug.toLowerCase());
}
