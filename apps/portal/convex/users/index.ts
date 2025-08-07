// Export modules for hierarchical access
import * as helpersModule from "./helpers";
import * as schemaModule from "./schema";

/**
 * User management and authentication functionality
 */

// Re-export query functions
export {
  getUserByClerkId,
  getUserByEmail,
  listUsers,
  getMe,
  getUserById,
  getSystemUser,
} from "./queries";

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
export * from "./schema/types";
export * from "./helpers";

// For backward compatibility - rename to listUsers
export { listUsers as listAllUsers } from "./queries";
// For backward compatibility - rename to createOrGetUser
export { createOrGetUser as ensureUser } from "./mutations";

export const helpers = helpersModule;
export const schema = schemaModule;
