/**
 * Internal functions for the Downloads module
 * These functions are not exposed to the client and are only used by other server functions
 */
// Re-export internal functions from mutations
export { extractAndAttachFeaturedImage, updateFeaturedImage, } from "./mutations";
// Re-export the image extraction utility
export * as lib from "./lib/imageExtraction";
