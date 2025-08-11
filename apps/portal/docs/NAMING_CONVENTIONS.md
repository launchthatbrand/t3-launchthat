# Convex Naming Conventions

This document outlines the naming conventions for Convex functions, files, and modules in the t3-launchthat project.

## Function Naming Conventions

### Query Functions

Queries should be named with a prefix that indicates the type of data retrieval:

- `get` - For retrieving a single record (e.g., `getUserById`, `getDocumentById`)
- `list` - For retrieving multiple records (e.g., `listUsers`, `listDocumentsByAuthor`)
- `count` - For counting records (e.g., `countUsers`, `countDocumentsByCategory`)
- `search` - For full-text search operations (e.g., `searchDocuments`)

### Mutation Functions

Mutations should be named with a prefix that indicates the type of modification:

- `create` - For creating new records (e.g., `createUser`, `createDocument`)
- `update` - For updating existing records (e.g., `updateUser`, `updateDocument`)
- `delete` - For deleting records (e.g., `deleteUser`, `deleteDocument`)
- `mark` - For changing status (e.g., `markDocumentAsRead`, `markNotificationAsSeen`)

### Action Functions

Actions should be named descriptively based on their behavior, with an `Action` suffix:

- `generateReportAction`
- `sendEmailAction`
- `processPaymentAction`

### Internal Functions

Internal functions should use the prefix `internal` to clearly indicate they're for internal use only:

- `internalEnsureUser`
- `internalValidateDocument`
- `internalGenerateId`

## File Structure and Organization

Each module should follow this structure:

```
module-name/
  ├── index.ts                 # Main entry point exporting all public functions
  ├── queries.ts               # All query functions
  ├── mutations.ts             # All mutation functions
  ├── actions.ts               # All action functions (if any)
  ├── schema/
  │   ├── index.ts             # Re-exports from schema files
  │   └── types.ts             # TypeScript interfaces for module
  └── lib/
      ├── index.ts             # Re-exports from lib files
      └── helpers.ts           # Helper functions
```

### Index Files

Index files should organize exports for a clean public API:

```typescript
// Export modules for hierarchical access
import * as libModule from "./lib";
import * as schemaModule from "./schema";

// Re-export query functions
export { getUserById, listUsers } from "./queries";

// Re-export mutation functions
export { createUser, updateUser, deleteUser } from "./mutations";

// Re-export schema and types
export * from "./schema";
export * from "./lib";

export const lib = libModule;
export const schema = schemaModule;
```

## Type Naming Conventions

- Interfaces should be named with PascalCase, descriptive nouns: `User`, `Document`, `NotificationPreference`
- Enums should be named with PascalCase, descriptive nouns: `UserRole`, `DocumentStatus`, `NotificationType`
- Type aliases should be named with PascalCase: `UserUpdateData`, `DocumentFilterOptions`

## Variable Naming Conventions

- Use camelCase for variable names
- Boolean variables should start with `is`, `has`, or `should`: `isAdmin`, `hasPermission`, `shouldNotify`
- Constants should use all UPPERCASE with underscores: `MAX_USERS`, `DEFAULT_TIMEOUT`
- Database fields should use camelCase consistently across the codebase

## Best Practices

- Keep function names descriptive but concise
- Use consistent naming across related modules
- When renaming, maintain backward compatibility by re-exporting with old names:
  ```typescript
  // For backward compatibility
  export { listUsers as listAllUsers } from "./queries";
  ```
- Group related functions together in the appropriate file
- Use TypeScript interfaces and type aliases for complex data structures
- Comment functions with JSDoc style documentation

By following these conventions consistently, we can maintain a clean, predictable, and easy-to-navigate codebase.
