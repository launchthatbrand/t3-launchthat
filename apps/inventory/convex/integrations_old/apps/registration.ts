/**
 * App registration framework for the integrations module
 *
 * This file provides utilities for registering, validating, and managing
 * third-party app integrations.
 */
import { ConvexError, v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../../_generated/server";
import {
  actionDefinitionValidator,
  authTypeValidator,
  triggerDefinitionValidator,
} from "../lib/validators";

/**
 * Common fields validator for app registration
 */
const appCommonFieldsValidator = v.object({
  name: v.string(),
  description: v.string(),
  iconUrl: v.string(),
  authType: authTypeValidator,

  // Auth configuration varies based on authType
  authConfig: v.object({}),
});

/**
 * Validator for app registration with triggers and actions
 */
const appRegistrationValidator = v.object({
  ...appCommonFieldsValidator.shape,
  triggers: v.array(triggerDefinitionValidator),
  actions: v.array(actionDefinitionValidator),
});

/**
 * Validator for app updating
 */
const appUpdateValidator = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  iconUrl: v.optional(v.string()),
  authConfig: v.optional(v.object({})),
  triggers: v.optional(v.array(triggerDefinitionValidator)),
  actions: v.optional(v.array(actionDefinitionValidator)),
});

/**
 * Register a new application with the integration system
 *
 * This allows third-party services to be used in integration scenarios
 */
export const registerApp = mutation({
  args: appRegistrationValidator,
  returns: v.id("apps"),
  handler: async (ctx, args) => {
    // Create the app record
    const appId = await ctx.db.insert("apps", {
      name: args.name,
      description: args.description,
      iconUrl: args.iconUrl,
      authType: args.authType,
      authConfig: args.authConfig,
      triggers: args.triggers,
      actions: args.actions,
    });

    // Audit the creation
    await ctx.db.insert("audit_logs", {
      action: "register_app",
      resourceType: "app",
      resourceId: appId,
      timestamp: Date.now(),
      userId: ctx.auth.userId ?? null,
      metadata: {
        appName: args.name,
        authType: args.authType,
        triggersCount: args.triggers.length,
        actionsCount: args.actions.length,
      },
    });

    return appId;
  },
});

/**
 * Get a list of all registered apps
 */
export const listApps = query({
  args: {
    // Optional search filter
    search: v.optional(v.string()),
    // Optional pagination
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.union(v.string(), v.null()),
      }),
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("apps"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      iconUrl: v.string(),
      authType: authTypeValidator,
      // We don't return the full authConfig for security
      authConfigFields: v.array(v.string()),
      triggersCount: v.number(),
      actionsCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    let appQuery = ctx.db.query("apps");

    // Apply search filter if provided
    if (args.search) {
      const search = args.search.toLowerCase();
      appQuery = appQuery.filter((q) =>
        q.or(
          q.field("name").contains(search),
          q.field("description").contains(search),
        ),
      );
    }

    // Apply pagination if provided
    let apps;
    if (args.paginationOpts) {
      const { page } = await appQuery.paginate(args.paginationOpts);
      apps = page;
    } else {
      apps = await appQuery.collect();
    }

    // Transform to safe response objects
    return apps.map((app) => ({
      _id: app._id,
      _creationTime: app._creationTime,
      name: app.name,
      description: app.description,
      iconUrl: app.iconUrl,
      authType: app.authType,
      // Only return field names, not values
      authConfigFields: Object.keys(app.authConfig),
      triggersCount: app.triggers.length,
      actionsCount: app.actions.length,
    }));
  },
});

/**
 * Get detailed information about a specific app
 */
export const getApp = query({
  args: {
    appId: v.id("apps"),
  },
  returns: v.union(
    v.object({
      _id: v.id("apps"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      iconUrl: v.string(),
      authType: authTypeValidator,
      // We don't return the full authConfig for security
      authConfigFields: v.array(v.string()),
      triggers: v.array(triggerDefinitionValidator),
      actions: v.array(actionDefinitionValidator),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const app = await ctx.db.get(args.appId);
    if (!app) {
      return null;
    }

    return {
      _id: app._id,
      _creationTime: app._creationTime,
      name: app.name,
      description: app.description,
      iconUrl: app.iconUrl,
      authType: app.authType,
      // Only return field names, not values
      authConfigFields: Object.keys(app.authConfig),
      triggers: app.triggers,
      actions: app.actions,
    };
  },
});

/**
 * Update an existing app
 */
export const updateApp = mutation({
  args: {
    appId: v.id("apps"),
    update: appUpdateValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { appId, update } = args;

    // Check if the app exists
    const app = await ctx.db.get(appId);
    if (!app) {
      throw new ConvexError({
        code: "not_found",
        message: "App not found",
      });
    }

    // Update the app
    await ctx.db.patch(appId, update);

    // Audit the update
    await ctx.db.insert("audit_logs", {
      action: "update_app",
      resourceType: "app",
      resourceId: appId,
      timestamp: Date.now(),
      userId: ctx.auth.userId ?? null,
      metadata: {
        appName: app.name,
        updatedFields: Object.keys(update),
      },
    });

    return true;
  },
});

/**
 * Delete an app and all its connections
 */
export const deleteApp = mutation({
  args: {
    appId: v.id("apps"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { appId } = args;

    // Check if the app exists
    const app = await ctx.db.get(appId);
    if (!app) {
      throw new ConvexError({
        code: "not_found",
        message: "App not found",
      });
    }

    // Find all connections for this app
    const connections = await ctx.db
      .query("connections")
      .withIndex("by_app", (q) => q.eq("appId", appId))
      .collect();

    // Delete all connections
    for (const connection of connections) {
      await ctx.db.delete(connection._id);
    }

    // Delete the app
    await ctx.db.delete(appId);

    // Audit the deletion
    await ctx.db.insert("audit_logs", {
      action: "delete_app",
      resourceType: "app",
      resourceId: appId,
      timestamp: Date.now(),
      userId: ctx.auth.userId ?? null,
      metadata: {
        appName: app.name,
        connectionsDeleted: connections.length,
      },
    });

    return true;
  },
});

/**
 * Get the auth configuration for an app (internal use only)
 */
export const getAppAuthConfig = internalQuery({
  args: {
    appId: v.id("apps"),
  },
  returns: v.union(
    v.object({
      authType: authTypeValidator,
      authConfig: v.object({}),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const app = await ctx.db.get(args.appId);
    if (!app) {
      return null;
    }

    return {
      authType: app.authType,
      authConfig: app.authConfig,
    };
  },
});

/**
 * Validate an app's configuration before registration
 */
export const validateAppConfig = mutation({
  args: appRegistrationValidator,
  returns: v.object({
    valid: v.boolean(),
    errors: v.optional(v.array(v.string())),
  }),
  handler: async (ctx, args) => {
    // Check for duplicate trigger IDs
    const triggerIds = new Set<string>();
    const errors: string[] = [];

    for (const trigger of args.triggers) {
      if (triggerIds.has(trigger.id)) {
        errors.push(`Duplicate trigger ID: ${trigger.id}`);
      }
      triggerIds.add(trigger.id);
    }

    // Check for duplicate action IDs
    const actionIds = new Set<string>();
    for (const action of args.actions) {
      if (actionIds.has(action.id)) {
        errors.push(`Duplicate action ID: ${action.id}`);
      }
      actionIds.add(action.id);
    }

    // Check for app name duplicates
    const existingApps = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("name"), args.name))
      .collect();

    if (existingApps.length > 0) {
      errors.push(`App name "${args.name}" is already in use`);
    }

    // Validate auth configuration based on auth type
    switch (args.authType) {
      case "oauth2":
        if (!args.authConfig.clientId || !args.authConfig.clientSecret) {
          errors.push("OAuth2 apps require clientId and clientSecret");
        }
        break;
      case "apiKey":
        if (!args.authConfig.apiKeyName) {
          errors.push("API Key apps require apiKeyName");
        }
        break;
      case "basic":
        if (!args.authConfig.usernameField || !args.authConfig.passwordField) {
          errors.push(
            "Basic auth apps require usernameField and passwordField",
          );
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
