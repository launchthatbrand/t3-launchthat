/**
 * Script to update TypeScript types in frontend code to match the new Convex schema
 *
 * This script fixes common TypeScript issues in frontend files after Convex refactoring
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import glob from "glob";

// Get the directory name equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define type mappings for tables
const typeReplacements: Record<string, string> = {
  // Old table names to new ones
  'Id<"groupPostsTable">': 'Id<"groupPosts">',
  'Id<"groupCommentsTable">': 'Id<"groupComments">',
  'Id<"postsTable">': 'Id<"posts">',
  'Id<"commentsTable">': 'Id<"comments">',
  'Id<"notificationsTable">': 'Id<"notifications">',
  'Id<"invitationsTable">': 'Id<"invitations">',

  // Bad type references
  "api.products": "api.ecommerce.products",
  "api.checkout": "api.ecommerce.checkout",
  "api.orders": "api.ecommerce.orders",

  // Common imports
  'import { Doc, Id } from "@/convex/_generated/dataModel";':
    'import { Doc, Id } from "../../../convex/_generated/dataModel";\nimport { UserIdType, TimestampType } from "../../../convex/shared/validators";',
};

// Scan frontend files for TypeScript type references
const srcDirectory = path.resolve(__dirname, "../src");
const files = glob.sync(`${srcDirectory}/**/*.{ts,tsx}`);

console.log(
  `Found ${files.length} TypeScript files to scan for type references`,
);

let totalReplacements = 0;
let filesModified = 0;

// Process each file
files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  let fileReplacements = 0;

  // Apply each mapping to the file content
  Object.entries(typeReplacements).forEach(([oldType, newType]) => {
    // Use regex to match exact references
    const regex = new RegExp(
      oldType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "g",
    );
    const matches = content.match(regex);

    if (matches && matches.length > 0) {
      content = content.replace(regex, newType);
      fileReplacements += matches.length;
      console.log(
        `  - Replaced ${matches.length} occurrences of ${oldType} with ${newType} in ${path.basename(file)}`,
      );
    }
  });

  // Write back modified content if changes were made
  if (fileReplacements > 0) {
    fs.writeFileSync(file, content, "utf8");
    filesModified++;
    totalReplacements += fileReplacements;
    console.log(
      `Updated ${path.basename(file)} with ${fileReplacements} type replacements`,
    );
  }
});

console.log(`\nSummary:`);
console.log(`- Total files scanned: ${files.length}`);
console.log(`- Files modified: ${filesModified}`);
console.log(`- Total replacements made: ${totalReplacements}`);

console.log(`\nNext steps:`);
console.log(`1. Run TypeScript checks to identify any remaining type errors`);
console.log(
  `2. Update remaining function references using the FRONTEND_UPDATE_GUIDE.md`,
);
console.log(`3. Test the application in development mode`);
