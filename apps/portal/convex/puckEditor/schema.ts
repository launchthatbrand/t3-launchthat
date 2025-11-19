import { defineTable } from "convex/server";
import { v } from "convex/values";

export const puckEditorTable = defineTable({
  /**
   * Unique identifier that scopes layouts to an organization/page combo.
   */
  pageIdentifier: v.string(),
  /**
   * Serialized Puck JSON payload.
   */
  data: v.string(),
}).index("by_pageIdentifier", ["pageIdentifier"]);

