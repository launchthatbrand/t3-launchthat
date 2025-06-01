import { ACTIONS, RESOURCE_TYPES } from "./constants";

/**
 * Type for resource types
 */
export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];

/**
 * Type for permission actions
 */
export type PermissionAction = (typeof ACTIONS)[keyof typeof ACTIONS];
