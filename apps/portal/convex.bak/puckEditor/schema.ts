import { defineTable } from "convex/server";
import { v } from "convex/values";

export const puckEditorTable = defineTable({
  pageIdentifier: v.string(),
  data: v.string(), // Storing Puck data as a JSON string
}).index("by_pageIdentifier", ["pageIdentifier"]);
