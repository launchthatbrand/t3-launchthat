import { z } from "zod";

import type {
  ActionDefinition,
  ActionExecutionContext,
  ActionExecutionResult,
} from "../../../packages/integration-sdk/src/node-types.js";

/**
 * Internal Node Actions Template
 *
 * This file defines all actions (operations) that can be performed with internal services.
 * Internal actions typically interact with your database, file system, or other internal APIs.
 */

// =====================================================
// SHARED SCHEMAS (reusable across actions)
// =====================================================

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["admin", "user", "guest"]),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

const SuccessResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

// =====================================================
// ACTION 1: Create User
// =====================================================

const CreateUserInputSchema = z.object({
  email: z.string().email("Must be a valid email address"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "user", "guest"]).default("user"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  metadata: z.record(z.unknown()).optional(),
});

const CreateUserOutputSchema = z.object({
  success: z.boolean(),
  data: UserSchema.optional(),
  error: z.string().optional(),
});

export const CreateUserAction: ActionDefinition = {
  id: "create_user",
  name: "Create User",
  description: "Create a new user account in the system",
  inputSchema: CreateUserInputSchema,
  outputSchema: CreateUserOutputSchema,

  async execute(
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    try {
      // Parse and validate input
      const input = CreateUserInputSchema.parse(context.inputData);

      // Hash password (example - use your actual password hashing)
      const hashedPassword = await hashPassword(input.password);

      // Create user in database (example - use your actual database client)
      const user = await db.user.create({
        data: {
          email: input.email,
          name: input.name,
          role: input.role,
          passwordHash: hashedPassword,
          metadata: input.metadata,
        },
      });

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
        logs: [`Successfully created user: ${user.email}`],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create user",
        logs: [`Failed to create user: ${error}`],
      };
    }
  },

  ui: {
    category: "User Management",
    featured: true,
    examples: [
      {
        name: "Create Admin User",
        description: "Create a new admin user account",
        input: {
          email: "admin@example.com",
          name: "Admin User",
          role: "admin",
          password: "secure-password-123",
        },
      },
      {
        name: "Create Regular User",
        description: "Create a standard user account",
        input: {
          email: "user@example.com",
          name: "Regular User",
          role: "user",
          password: "user-password-123",
        },
      },
    ],
    documentation: {
      description: "Creates a new user account with the specified details",
      usage: "Provide email, name, and password to create a new user",
      notes: [
        "Email must be unique across the system",
        "Password will be automatically hashed for security",
        "Default role is 'user' if not specified",
      ],
    },
  },
};

// =====================================================
// ACTION 2: Get User
// =====================================================

const GetUserInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

const GetUserOutputSchema = z.object({
  success: z.boolean(),
  data: UserSchema.optional(),
  error: z.string().optional(),
});

export const GetUserAction: ActionDefinition = {
  id: "get_user",
  name: "Get User",
  description: "Retrieve a user account by ID",
  inputSchema: GetUserInputSchema,
  outputSchema: GetUserOutputSchema,

  async execute(
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    try {
      const input = GetUserInputSchema.parse(context.inputData);

      // Get user from database
      const user = await db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return {
          success: false,
          error: `User not found: ${input.userId}`,
          logs: [`User with ID ${input.userId} does not exist`],
        };
      }

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt?.toISOString(),
        },
        logs: [`Successfully retrieved user: ${user.email}`],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get user",
        logs: [`Failed to get user: ${error}`],
      };
    }
  },

  ui: {
    category: "User Management",
    documentation: {
      description: "Retrieves a user account by its unique identifier",
      usage: "Provide the user ID to fetch the account details",
      notes: [
        "Returns all user data except sensitive information like passwords",
        "Returns error if user does not exist",
      ],
    },
  },
};

// =====================================================
// ACTION 3: Update User
// =====================================================

const UpdateUserInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  updates: z.object({
    email: z.string().email().optional(),
    name: z.string().min(1).optional(),
    role: z.enum(["admin", "user", "guest"]).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

const UpdateUserOutputSchema = z.object({
  success: z.boolean(),
  data: UserSchema.optional(),
  error: z.string().optional(),
});

export const UpdateUserAction: ActionDefinition = {
  id: "update_user",
  name: "Update User",
  description: "Update an existing user account",
  inputSchema: UpdateUserInputSchema,
  outputSchema: UpdateUserOutputSchema,

  async execute(
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    try {
      const input = UpdateUserInputSchema.parse(context.inputData);

      // Check if user exists
      const existingUser = await db.user.findUnique({
        where: { id: input.userId },
      });

      if (!existingUser) {
        return {
          success: false,
          error: `User not found: ${input.userId}`,
          logs: [`User with ID ${input.userId} does not exist`],
        };
      }

      // Update user in database
      const updatedUser = await db.user.update({
        where: { id: input.userId },
        data: {
          ...input.updates,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt.toISOString(),
          updatedAt: updatedUser.updatedAt?.toISOString(),
        },
        logs: [`Successfully updated user: ${updatedUser.email}`],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update user",
        logs: [`Failed to update user: ${error}`],
      };
    }
  },

  ui: {
    category: "User Management",
    examples: [
      {
        name: "Update User Role",
        description: "Change a user's role",
        input: {
          userId: "user-123",
          updates: {
            role: "admin",
          },
        },
      },
      {
        name: "Update User Profile",
        description: "Update user name and email",
        input: {
          userId: "user-123",
          updates: {
            name: "New Name",
            email: "newemail@example.com",
          },
        },
      },
    ],
    documentation: {
      description: "Updates specified fields of an existing user account",
      usage: "Provide user ID and the fields you want to update",
      notes: [
        "Only provided fields will be updated",
        "Email must be unique if being changed",
        "updatedAt timestamp is automatically set",
      ],
    },
  },
};

// =====================================================
// ACTION 4: Delete User
// =====================================================

const DeleteUserInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  softDelete: z.boolean().default(true),
});

const DeleteUserOutputSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      userId: z.string(),
      deletedAt: z.string(),
      softDelete: z.boolean(),
    })
    .optional(),
  error: z.string().optional(),
});

export const DeleteUserAction: ActionDefinition = {
  id: "delete_user",
  name: "Delete User",
  description: "Delete or deactivate a user account",
  inputSchema: DeleteUserInputSchema,
  outputSchema: DeleteUserOutputSchema,

  async execute(
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    try {
      const input = DeleteUserInputSchema.parse(context.inputData);

      // Check if user exists
      const existingUser = await db.user.findUnique({
        where: { id: input.userId },
      });

      if (!existingUser) {
        return {
          success: false,
          error: `User not found: ${input.userId}`,
          logs: [`User with ID ${input.userId} does not exist`],
        };
      }

      const deletedAt = new Date();

      if (input.softDelete) {
        // Soft delete - mark as deleted but keep in database
        await db.user.update({
          where: { id: input.userId },
          data: {
            deletedAt: deletedAt,
            email: `deleted_${deletedAt.getTime()}_${existingUser.email}`,
          },
        });
      } else {
        // Hard delete - remove from database
        await db.user.delete({
          where: { id: input.userId },
        });
      }

      return {
        success: true,
        data: {
          userId: input.userId,
          deletedAt: deletedAt.toISOString(),
          softDelete: input.softDelete,
        },
        logs: [
          `Successfully ${input.softDelete ? "soft" : "hard"} deleted user: ${existingUser.email}`,
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete user",
        logs: [`Failed to delete user: ${error}`],
      };
    }
  },

  ui: {
    category: "User Management",
    examples: [
      {
        name: "Soft Delete User",
        description: "Deactivate user account (recommended)",
        input: {
          userId: "user-123",
          softDelete: true,
        },
      },
      {
        name: "Hard Delete User",
        description: "Permanently remove user account",
        input: {
          userId: "user-123",
          softDelete: false,
        },
      },
    ],
    documentation: {
      description: "Deletes or deactivates a user account",
      usage: "Provide user ID and choose between soft or hard delete",
      notes: [
        "Soft delete is recommended - keeps data but marks as deleted",
        "Hard delete permanently removes user from database",
        "Soft deleted users can potentially be restored",
      ],
    },
  },
};

// =====================================================
// HELPER FUNCTIONS (Internal)
// =====================================================

// Example helper function - replace with your actual implementation
async function hashPassword(password: string): Promise<string> {
  // Use your actual password hashing library (bcrypt, argon2, etc.)
  // This is just a placeholder
  return `hashed_${password}`;
}

// Example database client - replace with your actual implementation
const db = {
  user: {
    create: async (options: any) => {
      // Replace with your actual database create logic
      return {
        id: "generated-id",
        email: options.data.email,
        name: options.data.name,
        role: options.data.role,
        createdAt: new Date(),
      };
    },
    findUnique: async (options: any): Promise<any> => {
      // Replace with your actual database find logic
      // Return null if not found, or user object if found
      return {
        id: options.where.id,
        email: "user@example.com",
        name: "Example User",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    update: async (options: any) => {
      // Replace with your actual database update logic
      return {
        id: options.where.id,
        email: "user@example.com",
        name: "Example User",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...options.data,
      };
    },
    delete: async (options: any) => {
      // Replace with your actual database delete logic
      return { id: options.where.id };
    },
  },
};

// =====================================================
// EXPORT ALL ACTIONS
// =====================================================

export const InternalServiceActions = {
  create_user: CreateUserAction,
  get_user: GetUserAction,
  update_user: UpdateUserAction,
  delete_user: DeleteUserAction,
  // Add more actions as needed
};

// Default export for convenience
export default InternalServiceActions;
