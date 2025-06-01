/**
 * Resource types in the application
 */
export const RESOURCE_TYPES = {
  EMAIL: "email",
  TEMPLATE: "template",
} as const;

/**
 * Actions that can be performed on resources
 */
export const ACTIONS = {
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  SHARE: "share",
} as const;
