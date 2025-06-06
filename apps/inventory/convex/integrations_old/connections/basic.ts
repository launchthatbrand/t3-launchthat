/**
 * Basic authentication for the integrations module
 *
 * This file provides functions for implementing Basic authentication
 * (username/password) for various third-party services.
 */
import { v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import { internalQuery, mutation } from "../../_generated/server";
import { security } from "../lib";
import { AuditEventType } from "../lib/audit";
import { getOptionalUserId } from "../lib/auth";
import { CONNECTION_STATUS } from "../lib/validators";

/**
 * Create a new Basic Auth connection
 */
export const createBasicAuthConnection = mutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    username: v.string(),
    password: v.string(),
    additionalFields: v.optional(v.record(v.string(), v.string())),
  },
  returns: v.object({
    success: v.boolean(),
    connectionId: v.optional(v.id("connections")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { appId, name, username, password, additionalFields } = args;

    try {
      // Get the app configuration
      const app = await ctx.db.get(args.appId);

      if (!app) {
        return {
          success: false,
          error: "App not found",
        };
      }

      // Ensure the app uses Basic authentication
      if (app.authType !== "basic") {
        return {
          success: false,
          error: "This app does not use Basic authentication",
        };
      }

      // Build the credentials object
      const credentials = {
        username,
        password,
        ...(additionalFields ?? {}),
      };

      // Encrypt the credentials
      const encryptedCredentials = security.encryptData(
        JSON.stringify(credentials),
      );

      if (!encryptedCredentials) {
        return {
          success: false,
          error: "Failed to encrypt credentials",
        };
      }

      // Get the user ID
      const userId = await getOptionalUserId(ctx);
      if (!userId) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      // Create the connection record
      const connectionId = await ctx.db.insert("connections", {
        appId,
        userId,
        name,
        status: CONNECTION_STATUS.ACTIVE,
        credentials: { encrypted: encryptedCredentials },
        updatedAt: Date.now(),
        lastUsed: Date.now(),
        metadata: {},
      });

      // Log the credential creation event
      await ctx.db.insert("audit_logs", {
        action: AuditEventType.CREDENTIAL_CREATE,
        resourceType: "connection",
        resourceId: connectionId,
        userId,
        timestamp: Date.now(),
        metadata: {
          connectionId,
          appId,
          hasCredentials: true,
          source: "basic",
        },
      });

      return {
        success: true,
        connectionId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error creating Basic Auth connection";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Validate a Basic Auth connection
 */
export const validateBasicAuthConnection = internalQuery({
  args: {
    connectionId: v.id("connections"),
  },
  returns: v.object({
    valid: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { connectionId } = args;

    try {
      // Get the connection
      const connection = await ctx.db.get(connectionId);

      if (!connection) {
        return {
          valid: false,
          error: "Connection not found",
        };
      }

      // Get the app
      const app = await ctx.db.get(connection.appId);

      if (!app) {
        return {
          valid: false,
          error: "App not found",
        };
      }

      // Ensure the app uses Basic authentication
      if (app.authType !== "basic") {
        return {
          valid: false,
          error: "This app does not use Basic authentication",
        };
      }

      // Decrypt the credentials
      const credentials = connection.credentials as { encrypted?: string };
      const encryptedData = credentials.encrypted;
      if (!encryptedData) {
        return {
          valid: false,
          error: "No credentials found",
        };
      }

      const decryptedJson = security.decryptData(encryptedData);
      if (!decryptedJson) {
        return {
          valid: false,
          error: "Failed to decrypt credentials",
        };
      }

      // Parse the credentials
      const parsedCredentials = JSON.parse(decryptedJson) as {
        username?: string;
        password?: string;
      };

      // Check if we have the required credentials
      if (!parsedCredentials.username || !parsedCredentials.password) {
        return {
          valid: false,
          error: "Incomplete credentials - missing username or password",
        };
      }

      // For basic auth, we can only verify format and presence
      // Actual validation would require making an API call to the service
      return {
        valid: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error validating Basic Auth";
      return {
        valid: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Update a Basic Auth connection
 */
export const updateBasicAuthConnection = mutation({
  args: {
    connectionId: v.id("connections"),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    additionalFields: v.optional(v.record(v.string(), v.string())),
    name: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { connectionId, username, password, additionalFields, name } = args;

    try {
      // Get the connection
      const connection = await ctx.db.get(connectionId);

      if (!connection) {
        return {
          success: false,
          error: "Connection not found",
        };
      }

      // Get the app
      const app = await ctx.db.get(connection.appId);

      if (!app) {
        return {
          success: false,
          error: "App not found",
        };
      }

      // Ensure the app uses Basic authentication
      if (app.authType !== "basic") {
        return {
          success: false,
          error: "This app does not use Basic authentication",
        };
      }

      // Get the user ID and check permissions
      const userId = await getOptionalUserId(ctx);
      if (!userId || userId !== connection.userId) {
        return {
          success: false,
          error: "Unauthorized to update this connection",
        };
      }

      // Update the connection
      const updates: Partial<typeof connection> = {
        updatedAt: Date.now(),
      };

      // Update name if provided
      if (name) {
        updates.name = name;
      }

      // Update credentials if provided
      if (username || password || additionalFields) {
        // Decrypt the existing credentials
        const credentials = connection.credentials as { encrypted?: string };
        const encryptedData = credentials.encrypted;

        let existingCredentials = {};
        if (encryptedData) {
          const decryptedJson = security.decryptData(encryptedData);
          if (decryptedJson) {
            existingCredentials = JSON.parse(decryptedJson) as Record<
              string,
              unknown
            >;
          }
        }

        // Merge with new credentials
        const updatedCredentials = {
          ...existingCredentials,
          ...(username ? { username } : {}),
          ...(password ? { password } : {}),
          ...(additionalFields ?? {}),
        };

        // Encrypt the updated credentials
        const encryptedCredentials = security.encryptData(
          JSON.stringify(updatedCredentials),
        );

        if (!encryptedCredentials) {
          return {
            success: false,
            error: "Failed to encrypt credentials",
          };
        }

        updates.credentials = { encrypted: encryptedCredentials };
        updates.status = CONNECTION_STATUS.ACTIVE;
      }

      // Update the connection record
      await ctx.db.patch(connectionId, updates);

      // Log the credential update event
      await ctx.db.insert("audit_logs", {
        action: AuditEventType.CREDENTIAL_UPDATE,
        resourceType: "connection",
        resourceId: connectionId,
        userId,
        timestamp: Date.now(),
        metadata: {
          connectionId,
          appId: connection.appId,
          hasCredentials: true,
          source: "basic",
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error updating Basic Auth connection";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
