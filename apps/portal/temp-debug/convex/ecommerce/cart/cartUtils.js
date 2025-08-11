/**
 * Updates a user's cart summary
 *
 * @param ctx - The Convex mutation context
 * @param userId - The user ID whose cart summary should be updated
 */
export async function updateCartSummary(ctx, userId) {
    // Get all cart items for this user
    const cartItems = await ctx.db
        .query("cartItems")
        .withIndex("by_user_saved", (q) => q.eq("userId", userId).eq("savedForLater", false))
        .collect();
    // Calculate total
    let subtotal = 0;
    for (const item of cartItems) {
        subtotal += item.price * item.quantity;
    }
    // Estimate tax (can be replaced with a real tax calculation service)
    const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100; // Simple 8% tax
    // Estimate shipping (can be replaced with a real shipping calculation service)
    let estimatedShipping = 0;
    if (subtotal > 0 && subtotal < 50) {
        estimatedShipping = 5.99;
    }
    // Look for existing cart summary
    const existingCartSummary = await ctx.db
        .query("cartSummary")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
    if (existingCartSummary) {
        // Update existing summary
        await ctx.db.patch(existingCartSummary._id, {
            itemCount: cartItems.length,
            subtotal,
            estimatedTax,
            estimatedShipping,
            updatedAt: Date.now(),
        });
    }
    else {
        // Create new summary
        await ctx.db.insert("cartSummary", {
            userId,
            itemCount: cartItems.length,
            subtotal,
            estimatedTax,
            estimatedShipping,
            updatedAt: Date.now(),
        });
    }
}
/**
 * Updates a guest cart summary
 *
 * @param ctx - The Convex mutation context
 * @param guestSessionId - The guest session ID whose cart summary should be updated
 */
export async function updateGuestCartSummary(ctx, guestSessionId) {
    // Get all cart items for this guest
    const cartItems = await ctx.db
        .query("cartItems")
        .withIndex("by_guest_saved", (q) => q.eq("guestSessionId", guestSessionId).eq("savedForLater", false))
        .collect();
    // Calculate total
    let subtotal = 0;
    for (const item of cartItems) {
        subtotal += item.price * item.quantity;
    }
    // Estimate tax (can be replaced with a real tax calculation service)
    const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100; // Simple 8% tax
    // Estimate shipping (can be replaced with a real shipping calculation service)
    let estimatedShipping = 0;
    if (subtotal > 0 && subtotal < 50) {
        estimatedShipping = 5.99;
    }
    // Look for existing cart summary
    const existingCartSummary = await ctx.db
        .query("cartSummary")
        .withIndex("by_guestSessionId", (q) => q.eq("guestSessionId", guestSessionId))
        .first();
    if (existingCartSummary) {
        // Update existing summary
        await ctx.db.patch(existingCartSummary._id, {
            itemCount: cartItems.length,
            subtotal,
            estimatedTax,
            estimatedShipping,
            updatedAt: Date.now(),
        });
    }
    else {
        // Create new summary
        await ctx.db.insert("cartSummary", {
            guestSessionId,
            itemCount: cartItems.length,
            subtotal,
            estimatedTax,
            estimatedShipping,
            updatedAt: Date.now(),
        });
    }
}
