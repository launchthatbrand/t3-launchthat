// Simple script to apply schema changes to Convex
// Run with: node scripts/migrate-schema.js

import { dirname, resolve } from "path";

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("📊 Updating Convex schema with new textAlign field...");

try {
  // Use npx to run convex dev (if local env) or deploy (if production)
  // This command will update the schema in Convex
  execSync("npx convex dev", {
    stdio: "inherit",
    cwd: resolve(__dirname, ".."), // Run from the portal directory
  });

  console.log("✅ Schema updated successfully!");
  console.log(
    "Note: You may need to restart your development server for changes to take effect.",
  );
} catch (error) {
  console.error(
    "❌ Error updating schema:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}

// Migration script to update group schema with vertical alignment
async function migrateGroupHeaders() {
  console.log("Starting migration for group headers...");

  try {
    // Replace with your actual API URL
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    // Get all groups
    const groups = await client.query(api.groups.queries.getAllGroups);
    console.log(`Found ${groups.length} groups to check`);

    let updatedCount = 0;

    // For each group with headerItems, check if they need verticalAlign
    for (const group of groups) {
      if (group.headerItems && group.headerItems.length > 0) {
        let needsUpdate = false;

        // Check if any headerItems are missing verticalAlign
        const updatedHeaderItems = group.headerItems.map((item) => {
          if (item.verticalAlign === undefined) {
            needsUpdate = true;
            return {
              ...item,
              verticalAlign: "middle", // Default to middle
            };
          }
          return item;
        });

        // If any items were updated, save the group
        if (needsUpdate) {
          await client.mutation(api.groups.mutations.updateGroup, {
            groupId: group._id,
            headerItems: updatedHeaderItems,
          });
          updatedCount++;
          console.log(`Updated group: ${group.name} (${group._id})`);
        }
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} groups.`);
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Run the migration
migrateGroupHeaders().catch(console.error);
