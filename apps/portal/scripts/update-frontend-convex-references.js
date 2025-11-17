/**
 * Script to update frontend Convex references to match the new naming conventions
 *
 * This script defines mappings from old function names to new ones based on the
 * standardized naming conventions in apps/portal/convex/NAMING_CONVENTIONS.md
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Define mappings for renamed functions
const functionMappings = {
  // Notifications module
  "api.notifications.getNotifications": "api.notifications.listNotifications",
  "api.notifications.getUserNotifications":
    "api.notifications.listNotificationsByClerkId",
  "api.notifications.getNotificationsByType":
    "api.notifications.listNotificationsByType",
  "api.notifications.getRecentNotifications":
    "api.notifications.listRecentNotifications",
  "api.notifications.getUnreadCount":
    "api.notifications.countUnreadNotifications",
  "api.notifications.getUserPreferences":
    "api.notifications.getNotificationPreferences",
  "api.notifications.updateUserPreferences":
    "api.notifications.updateNotificationPreferences",
  "api.notifications.resetUserPreferences":
    "api.notifications.resetNotificationPreferences",

  // Calendar module
  "api.calendar.getEvents": "api.calendar.queries.getCalendarEvents",
  "api.calendar.getEvent": "api.calendar.queries.getEventById",
  "api.calendar.getCalendars": "api.calendar.queries.listCalendars",
  "api.calendar.getPublicCalendars": "api.calendar.queries.getPublicCalendars",
  "api.calendar.getCalendarForEvent":
    "api.calendar.queries.getCalendarForEvent",
  "api.calendar.getEventById": "api.calendar.queries.getEventById",
  "api.calendar.getEventAttendees":
    "api.calendar.invitations.getEventAttendees",

  // Contacts module
  "api.contacts.getContact": "api.contacts.queries.getContact",
  "api.contacts.getAllContacts": "api.contacts.queries.getContacts",
  "api.contacts.getTags": "api.contacts.queries.getTags",
  "api.contacts.getContactCount": "api.contacts.queries.getContactCount",
  "api.contacts.exportContacts": "api.contacts.queries.exportContacts",
  "api.contacts.createContact": "api.contacts.crud.createContact",
  "api.contacts.updateContact": "api.contacts.crud.updateContact",
  "api.contacts.deleteContact": "api.contacts.crud.deleteContact",

  // Downloads module
  "api.downloads.getDownloads": "api.downloads.listDownloads",
  "api.downloads.getDownloadsByCategory":
    "api.downloads.listDownloadsByCategory",
  "api.downloads.getDownload": "api.downloads.getDownload",
  "api.downloadsLibrary.getAllDownloads":
    "api.downloadsLibrary.listAllDownloads",
  "api.downloadsLibrary.searchDownloads":
    "api.downloadsLibrary.searchAllDownloads",

  // Groups module
  "api.groups.getGroup": "api.groups.getGroup",
  "api.groups.getAllGroups": "api.groups.listGroups",
  "api.groups.index.getAllGroups": "api.groups.index.listGroups",
  "api.groups.getGroupMembers": "api.groups.getGroupMembers",
  "api.groups.getGroupInvitationsByClerkId":
    "api.groups.listGroupInvitationsByClerkId",
  "api.groups.getGroupJoinRequests": "api.groups.listGroupJoinRequests",

  // Users module
  "api.core.users.getUser": "api.core.users.getUserByClerkId",
  "api.core.users.getUserById": "api.core.users.getUserById",
  "api.core.users.getAllUsers": "api.core.users.listAllUsers",

  // Products module
  "api.products.getAllProducts": "api.products.listProducts",

  // Orders module
  "api.orders.getAllOrders": "api.orders.listOrders",
  "api.orders.getOrderCount": "api.orders.getOrdersCount",
  "api.orders.getCustomers": "api.orders.getRecentCustomers",

  // Courses module
  "api.courses.getAllCourses": "api.courses.listCourses",
};

// Scan frontend files for references to these functions
const srcDirectory = path.resolve(__dirname, "../src");
const files = glob.sync(`${srcDirectory}/**/*.{ts,tsx,js,jsx}`);

console.log(`Found ${files.length} files to scan for Convex references`);

let totalReplacements = 0;
let filesModified = 0;

// Process each file
files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  let originalContent = content;
  let fileReplacements = 0;

  // Apply each mapping to the file content
  Object.entries(functionMappings).forEach(([oldRef, newRef]) => {
    // Use regex to match exact references
    const regex = new RegExp(`${oldRef.replace(".", "\\.")}\\b`, "g");
    const matches = content.match(regex);

    if (matches && matches.length > 0) {
      content = content.replace(regex, newRef);
      fileReplacements += matches.length;
      console.log(
        `  - Replaced ${matches.length} occurrences of ${oldRef} with ${newRef} in ${path.basename(file)}`,
      );
    }
  });

  // Write back modified content if changes were made
  if (fileReplacements > 0) {
    fs.writeFileSync(file, content, "utf8");
    filesModified++;
    totalReplacements += fileReplacements;
    console.log(
      `Updated ${path.basename(file)} with ${fileReplacements} replacements`,
    );
  }
});

console.log(`\nSummary:`);
console.log(`- Total files scanned: ${files.length}`);
console.log(`- Files modified: ${filesModified}`);
console.log(`- Total replacements made: ${totalReplacements}`);

console.log(`\nNext steps:`);
console.log(
  `1. Check TypeScript errors to find any remaining references that need updating`,
);
console.log(
  `2. Build the project to verify all references have been correctly updated`,
);
console.log(`3. Run the application to test functionality`);
