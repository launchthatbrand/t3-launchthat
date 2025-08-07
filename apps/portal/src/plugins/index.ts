// Plugin Auto-Loader
// This file automatically loads all plugins when imported

// Import all plugins here - they self-register via their addAction/addFilter calls
import "./analytics";

// Log that plugins have been loaded
console.log("🔌 Plugin system initialized - all plugins loaded");

// Export hook functions for convenience
export * from "~/lib/hooks";
