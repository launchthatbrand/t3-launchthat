/**
 * Calculate the display price for a product
 *
 * Returns the sale price if available, otherwise the regular price
 *
 * @param product - The product document
 * @returns The display price to show to customers
 */
export function getDisplayPrice(product) {
    // If sale price exists and is greater than 0, use it
    if (product.salePrice !== undefined && product.salePrice > 0) {
        return product.salePrice;
    }
    // Otherwise use the regular price
    return product.price;
}
/**
 * Calculate the discount percentage for a product
 *
 * @param product - The product document
 * @returns The discount percentage (0-100) or undefined if no discount
 */
export function getDiscountPercentage(product) {
    // If no sale price or it's not lower than regular price, no discount
    if (product.salePrice === undefined ||
        product.salePrice <= 0 ||
        product.salePrice >= product.price) {
        return undefined;
    }
    // Calculate discount percentage
    const discount = ((product.price - product.salePrice) / product.price) * 100;
    // Round to whole number
    return Math.round(discount);
}
/**
 * Format price for display in the UI
 *
 * @param price - The price in cents
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param currency - The currency code (default: 'USD')
 * @returns Formatted price string
 */
export function formatPrice(price, locale = "en-US", currency = "USD") {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(price / 100);
}
