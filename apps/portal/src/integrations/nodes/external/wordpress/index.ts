import { WordPressActions } from "./actions/index";
import { WordPressConnection } from "./connection.js";
import { WordPressMetadata } from "./metadata.js";
import { WordPressTriggers } from "./triggers.js";

/**
 * WordPress Node Main Definition
 *
 * This file combines metadata, actions, triggers, and connection definitions
 * into a complete WordPress node that can be registered with the integration system.
 */

// =====================================================
// COMPLETE WORDPRESS NODE DEFINITION
// =====================================================

export const WordPressNodeDefinition = {
  // Basic metadata from metadata.ts
  metadata: WordPressMetadata,

  // All available actions from actions.ts
  actions: WordPressActions,

  // All available triggers from triggers.ts
  triggers: WordPressTriggers,

  // Connection definition from connection.ts
  connection: WordPressConnection,

  // Node-level settings (optional)
  settings: {
    // Global settings for the WordPress integration
    retryAttempts: 3,
    timeout: 30000, // 30 seconds
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
    },
  },
} as const;

// Default export
export default WordPressNodeDefinition;
