/**
 * Type definitions for the users module
 */
import { Id } from "../../_generated/dataModel";

/**
 * Available user roles
 */
export type UserRole = "admin" | "user";

/**
 * User record structure
 */
export interface User {
  _id: Id<"users">;
  _creationTime: number;
  name?: string;
  email: string;
  role: UserRole;
  tokenIdentifier?: string;
}

/**
 * User update payload
 */
export interface UserUpdateData {
  name?: string;
  email?: string;
  role?: UserRole;
}
