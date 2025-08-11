"use node";
/**
 * Utility for making HTTP requests from Convex actions
 * This is a thin wrapper around node-fetch to standardize API calls
 */
export async function httpFetch(url, options = {}) {
    // Default options
    const fetchOptions = {
        method: options.method ?? "GET",
        headers: options.headers ?? {},
        body: options.body,
    };
    // Add a timeout option
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, options.timeout ?? 10000); // Default 10 second timeout
    try {
        // Use node-fetch (available in Convex actions with "use node" directive)
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        return response;
    }
    catch (error) {
        // Rethrow with more context
        if (error instanceof Error) {
            throw new Error(`HTTP request to ${url} failed: ${error.message}`);
        }
        throw error;
    }
    finally {
        clearTimeout(timeoutId);
    }
}
