// Export modules for hierarchical access
import * as libModule from "./lib";
import * as schemaModule from "./schema";

/**
 * User management and authentication functionality
 */

// Re-export query functions
export { getUserByClerkId, listUsers, getMe, getUserById } from "./queries";

// Re-export mutation functions
export {
  makeCurrentUserAdmin,
  createOrGetUser,
  updateUser,
  deleteUser,
  internalEnsureUser,
} from "./mutations";

// Re-export schema and types
export * from "./schema";
export * from "./lib";

// For backward compatibility - rename to listUsers
export { listUsers as listAllUsers } from "./queries";
// For backward compatibility - rename to createOrGetUser
export { createOrGetUser as ensureUser } from "./mutations";

export const lib = libModule;
export const schema = schemaModule;
