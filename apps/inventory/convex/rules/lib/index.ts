/**
 * Rules Engine Library
 *
 * This module exports the core components of the rules engine,
 * providing a unified API for working with rules, triggers, conditions,
 * and actions.
 */

// Export interfaces
export * from "./interfaces";

// Export registry
export { RuleEngineRegistry } from "./registry";

// Export logger
export { RuleExecutionLogger } from "./logger";

// Export engine
export { RuleEngine } from "./engine";

// Export utility functions
export * from "./utils";

// Export integration components
export * from "./integration";

/**
 * Re-export integration-specific components
 */
export * from "./integration/registry";
export * from "./integration/plugin";
export * from "./integration/config";
export * from "./integration/adapters/monday";
