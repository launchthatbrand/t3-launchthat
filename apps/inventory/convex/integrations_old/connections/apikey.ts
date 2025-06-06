/**
 * API Key authentication for the integrations module
 *
 * This file provides functions for implementing API Key authentication
 * for various third-party services.
 */
import { v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import { internalQuery, mutation } from "../../_generated/server";
import { security } from "../lib";
import { AuditEventType } from "../lib/audit";
import { CONNECTION_STATUS } from "../lib/validators";

/**
 * Create a new API Key connection
 */
export const createApiKeyConnection = mutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    apiKey: v.string(),
    additionalFields: v.optional(v.record(v.string(), v.string())),
  },
  returns: v.object({
    success: v.boolean(),
    connectionId: v.optional(v.id("connections")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { appId, name, apiKey, additionalFields } = args;

    try {
      // Get the app configuration
      const app = await ctx.db.get(args.appId);

      if (!app) {
        return {
          success: false,
          error: "App not found",
        };
      }

      // Ensure the app uses API Key authentication
      if (app.authType !== "apiKey") {
        return {
          success: false,
          error: "This app does not use API Key authentication",
        };
      }

      // Build the credentials object
      const credentials = {
        apiKey,
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

      // Get the user ID from auth
      const userId = ctx.auth.userId;
      if (!userId) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      // Create the connection record
      const connectionId = await ctx.db.insert("connections", {
        appId,
        userId: userId as Id<"users">,
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
        userId: userId as Id<"users">,
        timestamp: Date.now(),
        metadata: {
          connectionId,
          appId,
          hasCredentials: true,
          source: "apiKey",
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
          : "Unknown error creating API Key connection";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Validate an API Key connection
 */
export const validateApiKeyConnection = internalQuery({
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

      // Ensure the app uses API Key authentication
      if (app.authType !== "apiKey") {
        return {
          valid: false,
          error: "This app does not use API Key authentication",
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
        apiKey?: string;
      };

      // Check if we have an API key
      if (!parsedCredentials.apiKey) {
        return {
          valid: false,
          error: "No API key available",
        };
      }

      // For API keys, we can only verify format and presence
      // Actual validation would require making an API call to the service
      return {
        valid: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error validating API Key";
      return {
        valid: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Update an API Key connection
 */
export const updateApiKeyConnection = mutation({
  args: {
    connectionId: v.id("connections"),
    apiKey: v.optional(v.string()),
    additionalFields: v.optional(v.record(v.string(), v.string())),
    name: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { connectionId, apiKey, additionalFields, name } = args;

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

      // Ensure the app uses API Key authentication
      if (app.authType !== "apiKey") {
        return {
          success: false,
          error: "This app does not use API Key authentication",
        };
      }

      // Check user has permission to update this connection
      const userId = ctx.auth.userId;
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
      if (apiKey || additionalFields) {
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
          ...(apiKey ? { apiKey } : {}),
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
        userId: userId as Id<"users">,
        timestamp: Date.now(),
        metadata: {
          connectionId,
          appId: connection.appId,
          hasCredentials: true,
          source: "apiKey",
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error updating API Key connection";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
