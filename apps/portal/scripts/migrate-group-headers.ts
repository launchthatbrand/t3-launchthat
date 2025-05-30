// Migration script to update group schema with vertical alignment
import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import dotenv from "dotenv";

interface CarouselItem {
  id: string;
  title?: string;
  excerpt?: string;
  imageUrl: string;
  template: "inline" | "stacked" | "overlay";
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  blogPostId?: string;
}

interface Group {
  _id: Id<"groups">;
  name: string;
  headerItems?: CarouselItem[];
}

// Load environment variables
dotenv.config();

// Check for Convex URL
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
  process.exit(1);
}

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function migrateGroupHeaders() {
  console.log("Starting migration for group headers...");

  try {
    // Get all groups
    const groupsResult = await client.query(api.groups.queries.listGroups, {
      filters: {},
      paginationOpts: { numItems: 50, cursor: null },
    });

    const groups = groupsResult.groups as unknown as Group[];
    console.log(`Found ${groups.length} groups to check`);

    let updatedCount = 0;

    // For each group with headerItems, check if they need updates
    for (const group of groups) {
      if (group.headerItems && group.headerItems.length > 0) {
        let needsUpdate = false;

        // Check if any headerItems are missing verticalAlign or padding
        const updatedHeaderItems = group.headerItems.map(
          (item: CarouselItem) => {
            let itemNeedsUpdate = false;
            const updates = { ...item };

            if (item.verticalAlign === undefined) {
              itemNeedsUpdate = true;
              updates.verticalAlign = "middle"; // Default to middle
            }

            if (item.padding === undefined) {
              itemNeedsUpdate = true;
              updates.padding = {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              };
            }

            if (itemNeedsUpdate) {
              needsUpdate = true;
              return updates;
            }

            return item;
          },
        );

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
