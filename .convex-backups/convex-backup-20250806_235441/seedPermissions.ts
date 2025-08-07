import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";
import {
  ADMIN_PERMISSIONS,
  CALENDAR_PERMISSIONS,
  CONTENT_PERMISSIONS,
  COURSE_PERMISSIONS,
  EVENT_PERMISSIONS,
  GROUP_PERMISSIONS,
  ORDER_PERMISSIONS,
  PRODUCT_PERMISSIONS,
  USER_PERMISSIONS,
} from "./core/lib/permissions";

// Helper function to get all defined permission keys from the constants
const getAllDefinedPermissionKeys = (): string[] => {
  return [
    ...Object.values(USER_PERMISSIONS),
    ...Object.values(GROUP_PERMISSIONS),
    ...Object.values(CONTENT_PERMISSIONS),
    ...Object.values(CALENDAR_PERMISSIONS),
    ...Object.values(EVENT_PERMISSIONS),
    ...Object.values(COURSE_PERMISSIONS),
    ...Object.values(PRODUCT_PERMISSIONS),
    ...Object.values(ORDER_PERMISSIONS),
    ...Object.values(ADMIN_PERMISSIONS),
  ];
};

/**
 * Seed the permissions table with default permissions.
 * This is an internal mutation and should ideally be run once during setup.
 */
export const seedPermissionsDefinitions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingPermissionsCount = (
      await ctx.db.query("permissions").collect()
    ).length;
    if (existingPermissionsCount > 0) {
      console.log(
        `Permissions table already has ${existingPermissionsCount} entries. Skipping definition seed.`,
      );
      return {
        success: true,
        message: "Permission definitions already seeded.",
      };
    }

    console.log("Seeding permission definitions into 'permissions' table...");

    const permissionsToCreate = [
      // User permissions
      {
        key: USER_PERMISSIONS.CREATE,
        name: "Create Users",
        description: "Create new users",
        resource: "user",
        action: "create",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "User Management",
      },
      {
        key: USER_PERMISSIONS.READ,
        name: "View Users",
        description: "View user profiles",
        resource: "user",
        action: "read",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "User Management",
      },
      {
        key: USER_PERMISSIONS.UPDATE,
        name: "Update Users",
        description: "Edit user information",
        resource: "user",
        action: "update",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "User Management",
      },
      {
        key: USER_PERMISSIONS.DELETE,
        name: "Delete Users",
        description: "Delete users",
        resource: "user",
        action: "delete",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "User Management",
      },
      {
        key: USER_PERMISSIONS.MANAGE,
        name: "Manage All Users",
        description: "Full control over users",
        resource: "user",
        action: "manage",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "User Management",
      },

      // Group permissions
      {
        key: GROUP_PERMISSIONS.CREATE,
        name: "Create Groups",
        description: "Create new groups",
        resource: "group",
        action: "create",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Group Management",
      },
      {
        key: GROUP_PERMISSIONS.READ,
        name: "View Groups",
        description: "View group information",
        resource: "group",
        action: "read",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Group Management",
      },
      {
        key: GROUP_PERMISSIONS.UPDATE,
        name: "Update Groups",
        description: "Edit group information",
        resource: "group",
        action: "update",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Group Management",
      },
      {
        key: GROUP_PERMISSIONS.DELETE,
        name: "Delete Groups",
        description: "Delete groups",
        resource: "group",
        action: "delete",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Group Management",
      },
      {
        key: GROUP_PERMISSIONS.MANAGE,
        name: "Manage All Groups",
        description: "Full control over groups",
        resource: "group",
        action: "manage",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Group Management",
      },
      {
        key: GROUP_PERMISSIONS.JOIN,
        name: "Join Groups",
        description: "Join existing groups",
        resource: "group",
        action: "join",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Group Management",
      },
      {
        key: GROUP_PERMISSIONS.INVITE,
        name: "Invite to Groups",
        description: "Invite users to groups",
        resource: "group",
        action: "invite",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Group Management",
      },

      // Content Permissions
      {
        key: CONTENT_PERMISSIONS.CREATE,
        name: "Create Content",
        description: "Create content entries",
        resource: "content",
        action: "create",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Content Management",
      },
      {
        key: CONTENT_PERMISSIONS.READ,
        name: "Read Content",
        description: "Read content entries",
        resource: "content",
        action: "read",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Content Management",
      },
      {
        key: CONTENT_PERMISSIONS.UPDATE,
        name: "Update Content",
        description: "Update own content entries",
        resource: "content",
        action: "update",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Content Management",
      },
      {
        key: CONTENT_PERMISSIONS.DELETE,
        name: "Delete Content",
        description: "Delete own content entries",
        resource: "content",
        action: "delete",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Content Management",
      },
      {
        key: CONTENT_PERMISSIONS.PUBLISH,
        name: "Publish Content",
        description: "Publish content entries",
        resource: "content",
        action: "publish",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Content Management",
      },
      {
        key: CONTENT_PERMISSIONS.APPROVE,
        name: "Approve Content",
        description: "Approve content for publishing",
        resource: "content",
        action: "approve",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Content Management",
      },

      // Calendar Permissions
      {
        key: CALENDAR_PERMISSIONS.CREATE,
        name: "Create Calendar",
        description: "Create new calendars",
        resource: "calendar",
        action: "create",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Calendar",
      },
      {
        key: CALENDAR_PERMISSIONS.READ,
        name: "Read Calendar",
        description: "Read calendars",
        resource: "calendar",
        action: "read",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Calendar",
      },
      {
        key: CALENDAR_PERMISSIONS.UPDATE,
        name: "Update Calendar",
        description: "Update own calendars",
        resource: "calendar",
        action: "update",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Calendar",
      },
      {
        key: CALENDAR_PERMISSIONS.DELETE,
        name: "Delete Calendar",
        description: "Delete own calendars",
        resource: "calendar",
        action: "delete",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Calendar",
      },
      {
        key: CALENDAR_PERMISSIONS.SHARE,
        name: "Share Calendar",
        description: "Share own calendars",
        resource: "calendar",
        action: "share",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Calendar",
      },

      // Event Permissions
      {
        key: EVENT_PERMISSIONS.CREATE,
        name: "Create Events",
        description: "Create new events",
        resource: "event",
        action: "create",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Events",
      },
      {
        key: EVENT_PERMISSIONS.READ,
        name: "Read Events",
        description: "Read events",
        resource: "event",
        action: "read",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Events",
      },
      {
        key: EVENT_PERMISSIONS.UPDATE,
        name: "Update Events",
        description: "Update own events",
        resource: "event",
        action: "update",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Events",
      },
      {
        key: EVENT_PERMISSIONS.DELETE,
        name: "Delete Events",
        description: "Delete own events",
        resource: "event",
        action: "delete",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Events",
      },
      {
        key: EVENT_PERMISSIONS.INVITE,
        name: "Invite to Events",
        description: "Invite attendees to own events",
        resource: "event",
        action: "invite",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Events",
      },
      {
        key: EVENT_PERMISSIONS.MANAGE_ATTENDEES,
        name: "Manage Event Attendees",
        description: "Manage attendees for own events",
        resource: "event",
        action: "manage_attendees",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Events",
      },

      // Course Permissions
      {
        key: COURSE_PERMISSIONS.CREATE,
        name: "Create Courses",
        description: "Create new courses",
        resource: "course",
        action: "create",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Courses",
      },
      {
        key: COURSE_PERMISSIONS.READ,
        name: "Read Courses",
        description: "Read course content",
        resource: "course",
        action: "read",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Courses",
      },
      {
        key: COURSE_PERMISSIONS.UPDATE,
        name: "Update Courses",
        description: "Update course content",
        resource: "course",
        action: "update",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Courses",
      }, // Typically admin/instructor
      {
        key: COURSE_PERMISSIONS.DELETE,
        name: "Delete Courses",
        description: "Delete courses",
        resource: "course",
        action: "delete",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Courses",
      },
      {
        key: COURSE_PERMISSIONS.ENROLL,
        name: "Enroll in Courses",
        description: "Enroll in courses",
        resource: "course",
        action: "enroll",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Courses",
      },
      {
        key: COURSE_PERMISSIONS.GRADE,
        name: "Grade Coursework",
        description: "Grade coursework",
        resource: "course",
        action: "grade",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Courses",
      }, // Typically admin/instructor

      // Product Permissions
      {
        key: PRODUCT_PERMISSIONS.CREATE,
        name: "Create Products",
        description: "Create new products",
        resource: "product",
        action: "create",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Products",
      },
      {
        key: PRODUCT_PERMISSIONS.READ,
        name: "Read Products",
        description: "Read product information",
        resource: "product",
        action: "read",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Products",
      },
      {
        key: PRODUCT_PERMISSIONS.UPDATE,
        name: "Update Products",
        description: "Update product information",
        resource: "product",
        action: "update",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Products",
      },
      {
        key: PRODUCT_PERMISSIONS.DELETE,
        name: "Delete Products",
        description: "Delete products",
        resource: "product",
        action: "delete",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Products",
      },
      {
        key: PRODUCT_PERMISSIONS.MANAGE_INVENTORY,
        name: "Manage Inventory",
        description: "Manage product inventory",
        resource: "product",
        action: "manage_inventory",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Products",
      },
      {
        key: PRODUCT_PERMISSIONS.MANAGE_PRICING,
        name: "Manage Pricing",
        description: "Manage product pricing",
        resource: "product",
        action: "manage_pricing",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Products",
      },

      // Order Permissions
      {
        key: ORDER_PERMISSIONS.CREATE,
        name: "Create Orders",
        description: "Create new orders (typically by system/user checkout)",
        resource: "order",
        action: "create",
        defaultLevel: "all" as const,
        isSystem: true,
        category: "Orders",
      },
      {
        key: ORDER_PERMISSIONS.READ,
        name: "Read Orders",
        description: "Read order information",
        resource: "order",
        action: "read",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "Orders",
      }, // Own for users, all for admin
      {
        key: ORDER_PERMISSIONS.UPDATE,
        name: "Update Orders",
        description: "Update order status, tracking, etc.",
        resource: "order",
        action: "update",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Orders",
      }, // Admin
      {
        key: ORDER_PERMISSIONS.DELETE,
        name: "Delete Orders",
        description: "Delete orders (use with caution)",
        resource: "order",
        action: "delete",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Orders",
      }, // Admin
      {
        key: ORDER_PERMISSIONS.PROCESS,
        name: "Process Orders",
        description: "Process and fulfill orders",
        resource: "order",
        action: "process",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Orders",
      }, // Admin
      {
        key: ORDER_PERMISSIONS.REFUND,
        name: "Refund Orders",
        description: "Issue refunds for orders",
        resource: "order",
        action: "refund",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Orders",
      }, // Admin

      // Admin permissions
      {
        key: ADMIN_PERMISSIONS.MANAGE_ROLES,
        name: "Manage Roles",
        description:
          "Create, update, delete roles and assign permissions to them",
        resource: "admin",
        action: "manage_roles",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Admin",
      },
      {
        key: ADMIN_PERMISSIONS.MANAGE_PERMISSIONS,
        name: "Manage Permissions",
        description:
          "Define and manage system permissions (developer/superadmin)",
        resource: "admin",
        action: "manage_permissions",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Admin",
      },
      {
        key: ADMIN_PERMISSIONS.SYSTEM_SETTINGS,
        name: "Manage System Settings",
        description: "Configure global system settings",
        resource: "admin",
        action: "system_settings",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Admin",
      },
      {
        key: ADMIN_PERMISSIONS.VIEW_LOGS,
        name: "View System Logs",
        description: "Access and view system logs",
        resource: "admin",
        action: "view_logs",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "Admin",
      },
    ];

    for (const p of permissionsToCreate) {
      // Check if permission with this key already exists
      const existing = await ctx.db
        .query("permissions")
        .withIndex("by_key", (q) => q.eq("key", p.key))
        .first();
      if (!existing) {
        await ctx.db.insert("permissions", p);
      } else {
        // Optionally update existing permission if definitions change
        // await ctx.db.patch(existing._id, p);
        console.log(`Permission key ${p.key} already exists. Skipping.`);
      }
    }
    console.log(
      `Successfully seeded/verified ${permissionsToCreate.length} permission definitions.`,
    );
    return {
      success: true,
      message: "Permission definitions seeded successfully.",
    };
  },
});

/**
 * Seeds the database with initial roles, assigns permissions to them,
 * and links existing users to these roles.
 * This should be run manually after setting up the database and ensuring permissions are defined.
 */
export const seedInitialRolesAndPermissions = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      // Step 1: Ensure permission definitions are seeded
      const permissionSeedResult = await ctx.runMutation(
        internal.seedPermissions.seedPermissionsDefinitions,
      );
      console.log(permissionSeedResult.message);
      if (
        !permissionSeedResult.success &&
        !permissionSeedResult.message.includes("already seeded")
      ) {
        throw new Error(
          "Failed to seed permission definitions. Aborting role seed.",
        );
      }

      const allDefinedKeys = getAllDefinedPermissionKeys();
      const allSystemPermissions = await ctx.db
        .query("permissions")
        .filter((q) => q.eq(q.field("isSystem"), true))
        .collect();

      if (allSystemPermissions.length === 0 && allDefinedKeys.length > 0) {
        console.warn(
          "No system permissions found in DB, but permission constants exist. This might indicate an issue with seedPermissionsDefinitions or its execution. Attempting to use constants.",
        );
      }

      const availablePermissionKeys =
        allSystemPermissions.length > 0
          ? allSystemPermissions.map((p) => p.key)
          : allDefinedKeys;

      if (availablePermissionKeys.length === 0) {
        throw new Error(
          "No permission keys available to assign to roles. Ensure seedPermissionsDefinitions has run successfully.",
        );
      }

      // Step 2: Create "Admin" role if it doesn't exist
      let adminRoleDoc: Doc<"roles"> | null = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", "Admin"))
        .first();

      if (!adminRoleDoc) {
        const adminRoleId = await ctx.db.insert("roles", {
          name: "Admin",
          description: "System Administrator with full access",
          isSystem: true,
          isAssignable: true,
          priority: 100,
          scope: "global",
        });
        adminRoleDoc = await ctx.db.get(adminRoleId);
        if (!adminRoleDoc)
          throw new Error("Failed to retrieve Admin role after creation.");
        console.log(`Created "Admin" role with ID: ${adminRoleId}`);
      } else {
        console.log(`"Admin" role already exists with ID: ${adminRoleDoc._id}`);
      }
      const adminRole: Doc<"roles"> = adminRoleDoc; // Type guard for subsequent use

      // Step 3: Assign ALL available system permissions to "Admin" role
      const adminRolePermissionsCount = (
        await ctx.db
          .query("rolePermissions")
          .filter((q) => q.eq(q.field("roleId"), adminRole._id))
          .collect()
      ).length;
      if (adminRolePermissionsCount < availablePermissionKeys.length) {
        console.log(
          `Assigning all ${availablePermissionKeys.length} system permissions to "Admin" role...`,
        );
        for (const permKey of availablePermissionKeys) {
          const existingLink = await ctx.db
            .query("rolePermissions")
            .withIndex("by_role_permission", (q) =>
              q.eq("roleId", adminRole._id).eq("permissionKey", permKey),
            )
            .first();
          if (!existingLink) {
            await ctx.db.insert("rolePermissions", {
              roleId: adminRole._id,
              permissionKey: permKey,
              level: "all" as const,
            });
          }
        }
        console.log(
          `All system permissions assigned/verified for "Admin" role.`,
        );
      } else {
        console.log(
          `"Admin" role already has all ${availablePermissionKeys.length} system permissions assigned.`,
        );
      }

      // Step 4: Create "User" role if it doesn't exist
      let userRoleDoc: Doc<"roles"> | null = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", "User"))
        .first();

      if (!userRoleDoc) {
        const userRoleId = await ctx.db.insert("roles", {
          name: "User",
          description: "Standard user with basic access",
          isSystem: true,
          isAssignable: true,
          priority: 10,
          scope: "global",
        });
        userRoleDoc = await ctx.db.get(userRoleId);
        if (!userRoleDoc)
          throw new Error("Failed to retrieve User role after creation.");
        console.log(`Created "User" role with ID: ${userRoleId}`);
      } else {
        console.log(`"User" role already exists with ID: ${userRoleDoc._id}`);
      }
      const userRole: Doc<"roles"> = userRoleDoc; // Type guard

      // Step 5: Assign basic permissions to "User" role
      const basicUserPermissionKeys = [
        USER_PERMISSIONS.READ,
        USER_PERMISSIONS.UPDATE,
        CONTENT_PERMISSIONS.CREATE,
        CONTENT_PERMISSIONS.READ,
        CONTENT_PERMISSIONS.UPDATE,
        CONTENT_PERMISSIONS.DELETE,
        GROUP_PERMISSIONS.CREATE,
        GROUP_PERMISSIONS.READ,
        GROUP_PERMISSIONS.JOIN,
        CALENDAR_PERMISSIONS.READ,
        CALENDAR_PERMISSIONS.CREATE,
        EVENT_PERMISSIONS.READ,
        EVENT_PERMISSIONS.CREATE,
        COURSE_PERMISSIONS.READ,
        COURSE_PERMISSIONS.ENROLL,
        PRODUCT_PERMISSIONS.READ,
        ORDER_PERMISSIONS.CREATE,
        ORDER_PERMISSIONS.READ,
      ];

      console.log(`Assigning basic permissions to "User" role...`);
      for (const permKey of basicUserPermissionKeys) {
        if (!availablePermissionKeys.includes(permKey)) {
          console.warn(
            `Skipping assignment of unknown permission key "${permKey}" to User role.`,
          );
          continue;
        }
        const existingLink = await ctx.db
          .query("rolePermissions")
          .withIndex("by_role_permission", (q) =>
            q.eq("roleId", userRole._id).eq("permissionKey", permKey),
          )
          .first();
        if (!existingLink) {
          let levelToAssign: "own" | "all" = "all";
          if (
            permKey.includes(":update") ||
            permKey.includes(":delete") ||
            permKey === ORDER_PERMISSIONS.READ ||
            permKey === USER_PERMISSIONS.READ ||
            permKey === USER_PERMISSIONS.UPDATE
          ) {
            levelToAssign = "own";
          }
          await ctx.db.insert("rolePermissions", {
            roleId: userRole._id,
            permissionKey: permKey,
            level: levelToAssign,
          });
        }
      }
      console.log("Basic permissions assigned/verified for 'User' role.");

      // Step 6: Link existing users to these roles
      const allUsers = await ctx.db.query("users").collect();
      console.log(`Checking role assignments for ${allUsers.length} users...`);

      for (const user of allUsers) {
        const existingUserRoleLinks = await ctx.db
          .query("userRoles")
          .withIndex("by_user_scope", (q) =>
            q
              .eq("userId", user._id)
              .eq("scopeType", "global")
              .eq("scopeId", undefined),
          )
          .collect();

        if (user.role === "admin") {
          const hasAdminRoleLink = existingUserRoleLinks.some(
            (link) => link.roleId === adminRole._id,
          );
          if (!hasAdminRoleLink) {
            await ctx.db.insert("userRoles", {
              userId: user._id,
              roleId: adminRole._id,
              scopeType: "global",
              assignedAt: Date.now(),
            });
            console.log(
              `Assigned "Admin" role to user ${user.name ?? user._id.toString()} (ID: ${user._id})`,
            );
          }
        } else {
          const hasUserRoleLink = existingUserRoleLinks.some(
            (link) => link.roleId === userRole._id,
          );
          if (!hasUserRoleLink && existingUserRoleLinks.length === 0) {
            await ctx.db.insert("userRoles", {
              userId: user._id,
              roleId: userRole._id,
              scopeType: "global",
              assignedAt: Date.now(),
            });
            console.log(
              `Assigned "User" role to user ${user.name ?? user._id.toString()} (ID: ${user._id})`,
            );
          }
        }
      }
      console.log("User role linking complete.");
      return {
        success: true,
        message: "Initial roles and permissions seeded, and users linked.",
      };
    } catch (error) {
      console.error("Error seeding initial roles and permissions:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { success: false, message: `Seeding failed: ${errorMessage}` };
    }
  },
});
