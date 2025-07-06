import { filter } from "convex-helpers/server/filter";
// Remove unused type imports
// import type { Doc, Id } from "./_generated/dataModel";
// import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api"; // Ensure internal is imported
import { internalMutation, mutation, query } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission"; // Use the consolidated version

// Courses logic will be moved here
export {};

// --- Course Structure Management ---

// Re-export consolidated modules for external consumers
export * from "./queries";
export * from "./mutations";
