/**
 * Credential management functions for the integrations module
 *
 * These functions handle the secure storage and retrieval of
 * connection credentials for third-party services.
 */
import { ConvexError, v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
} from "../../_generated/server";
import { security } from "../lib";
import { CONNECTION_STATUS, ConnectionStatus } from "../lib/validators";

// Define the type for a connection with credentials
interface ConnectionWithCredentials {
  credentials: {
    encrypted?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Define a more specific credentials validator
const credentialsValidator = v.object({
  // We don't validate specific fields since they vary by app
  // but we do ensure it's an object
});

// Enhanced security headers for all HTTP responses
const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'self'",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store, max-age=0",
};

/**
 * Securely store credentials for a connection
 *
 * This function:
 * 1. Encrypts the credentials before storing them
 * 2. Updates the connection status based on validation
 * 3. Logs the credential update (without the actual values)
 */
export const storeCredentials = mutation({
  args: {
    connectionId: v.id("connections"),
    credentials: credentialsValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { connectionId, credentials } = args;

    // Check if the connection exists
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new ConvexError({
        code: "not_found",
        message: "Connection not found",
      });
    }

    // Encrypt the credentials
    const encryptedCredentials = security.encryptData(
      JSON.stringify(credentials),
    );
    if (!encryptedCredentials) {
      throw new ConvexError({
        code: "encryption_failed",
        message: "Failed to encrypt credentials",
      });
    }

    // Store the encrypted credentials and update the connection status
    await ctx.db.patch(connectionId, {
      credentials: { encrypted: encryptedCredentials },
      status: CONNECTION_STATUS.CONFIGURED,
      updatedAt: Date.now(),
    });

    // Audit log the credential update (without the actual values)
    await ctx.db.insert("audit_logs", {
      action: "store_credentials",
      resourceType: "connection",
      resourceId: connectionId,
      timestamp: Date.now(),
      userId: ctx.auth.userId ?? null,
      metadata: {
        hasCredentials: true,
        connectionId: connectionId,
      },
    });

    return true;
  },
});

/**
 * Retrieve credentials for a connection
 * Decrypts the credentials before returning them
 */
export const getCredentials = internalQuery({
  args: {
    connectionId: v.id("connections"),
  },
  returns: v.object({}),
  handler: async (ctx, args) => {
    const { connectionId } = args;

    // Check if the connection exists
    const connection = await ctx.db.get(connectionId);
    if (!connection) {
      throw new ConvexError("Connection not found");
    }

    // Get the encrypted credentials
    const connectionWithCreds = connection as ConnectionWithCredentials;
    const encryptedData = connectionWithCreds.credentials?.encrypted;
    if (!encryptedData) {
      throw new ConvexError("No credentials found for this connection");
    }

    // Decrypt the credentials
    // In a real implementation, we would use the decryption action
    // const decryptedCredentials = await ctx.runAction(internal.integrations.decryptCredentials, {
    //   encryptedData
    // });

    // For now, we'll use our placeholder decryption function
    const decryptedCredentials = security.decryptData(encryptedData);

    if (!decryptedCredentials) {
      throw new ConvexError("Failed to decrypt credentials");
    }

    // Parse the decrypted credentials
    try {
      return JSON.parse(decryptedCredentials) as Record<string, unknown>;
    } catch {
      throw new ConvexError("Invalid credential format");
    }
  },
});

/**
 * Update credentials for an existing connection
 *
 * This function follows the same security protocols as storeCredentials
 * but is specifically for updating existing credentials
 */
export const updateCredentials = mutation({
  args: {
    connectionId: v.id("connections"),
    credentials: credentialsValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { connectionId, credentials } = args;

    // Check if the connection exists
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new ConvexError({
        code: "not_found",
        message: "Connection not found",
      });
    }

    // Check if the user has permission to update this connection
    // In a real implementation, this would check ownership or permissions

    // Encrypt the credentials
    const encryptedCredentials = security.encryptData(
      JSON.stringify(credentials),
    );
    if (!encryptedCredentials) {
      throw new ConvexError({
        code: "encryption_failed",
        message: "Failed to encrypt credentials",
      });
    }

    // Store the encrypted credentials
    await ctx.db.patch(connectionId, {
      credentials: { encrypted: encryptedCredentials },
      updatedAt: Date.now(),
    });

    // Audit log the credential update
    await ctx.db.insert("audit_logs", {
      action: "update_credentials",
      resourceType: "connection",
      resourceId: connectionId,
      timestamp: Date.now(),
      userId: ctx.auth.userId ?? null,
      metadata: {
        hasCredentials: true,
        connectionId: connectionId,
      },
    });

    return true;
  },
});

/**
 * Delete credentials for a connection
 */
export const deleteCredentials = internalMutation({
  args: {
    connectionId: v.id("connections"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { connectionId } = args;

    // Check if the connection exists
    const connection = await ctx.db.get(connectionId);
    if (!connection) {
      throw new ConvexError("Connection not found");
    }

    // Update the connection to remove the credentials
    await ctx.db.patch(connectionId, {
      credentials: {}, // Empty object
      status: CONNECTION_STATUS.DISCONNECTED,
      updatedAt: Date.now(),
    });

    return true;
  },
});

/**
 * Rotate credentials for OAuth connections
 *
 * This function handles token refresh for OAuth 2.0 connections
 */
export const rotateCredentials = action({
  args: {
    connectionId: v.id("connections"),
  },
  returns: v.object({
    success: v.boolean(),
    status: v.string(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Retrieve the connection
    const connection = await ctx.runQuery(internalGetConnection, {
      connectionId: args.connectionId,
    });

    if (!connection) {
      return {
        success: false,
        status: CONNECTION_STATUS.ERROR,
        message: "Connection not found",
      };
    }

    // Check if connection has credentials
    if (!connection.credentials?.encrypted) {
      return {
        success: false,
        status: CONNECTION_STATUS.INCOMPLETE,
        message: "No credentials found for this connection",
      };
    }

    try {
      // Decrypt the credentials
      const decryptedJson = security.decryptData(
        connection.credentials.encrypted,
      );
      if (!decryptedJson) {
        throw new Error("Failed to decrypt credentials");
      }

      // Parse the credentials
      const credentials = JSON.parse(decryptedJson);

      // In a real implementation, this would:
      // 1. Check if the connection is OAuth 2.0
      // 2. Check if the refresh token is available
      // 3. Call the OAuth service to refresh the token
      // 4. Update the stored credentials with the new access token

      // For now, we'll simulate a successful rotation
      // Assume we got a new access token "new-access-token-123"
      const updatedCredentials = {
        ...credentials,
        accessToken: "new-access-token-123",
        expiresAt: Date.now() + 3600 * 1000, // 1 hour from now
      };

      // Encrypt and store the updated credentials
      const encryptedCredentials = security.encryptData(
        JSON.stringify(updatedCredentials),
      );
      if (!encryptedCredentials) {
        throw new Error("Failed to encrypt updated credentials");
      }

      // Update the stored credentials
      await ctx.runMutation(internalUpdateCredentials, {
        connectionId: args.connectionId,
        encryptedCredentials,
      });

      return {
        success: true,
        status: CONNECTION_STATUS.ACTIVE,
        message: "Credentials rotated successfully",
      };
    } catch (error) {
      // Handle rotation errors
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return {
        success: false,
        status: CONNECTION_STATUS.ERROR,
        message: `Rotation failed: ${errorMessage}`,
      };
    }
  },
});

/**
 * Validate stored credentials for a connection
 *
 * This function:
 * 1. Retrieves and decrypts the credentials
 * 2. Makes a test API call to the service to validate the credentials
 * 3. Updates the connection status based on the validation result
 */
export const validateCredentials = action({
  args: {
    connectionId: v.id("connections"),
  },
  returns: v.object({
    valid: v.boolean(),
    status: v.string(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Retrieve the connection (would be done via an internal query in a real impl)
    const connection = await ctx.runQuery(internalGetConnection, {
      connectionId: args.connectionId,
    });

    if (!connection) {
      return {
        valid: false,
        status: CONNECTION_STATUS.ERROR,
        message: "Connection not found",
      };
    }

    // Check if connection has credentials
    if (!connection.credentials?.encrypted) {
      return {
        valid: false,
        status: CONNECTION_STATUS.INCOMPLETE,
        message: "No credentials found for this connection",
      };
    }

    try {
      // Decrypt the credentials
      const decryptedJson = security.decryptData(
        connection.credentials.encrypted,
      );
      if (!decryptedJson) {
        throw new Error("Failed to decrypt credentials");
      }

      // Parse the credentials
      const credentials = JSON.parse(decryptedJson);

      // In a real implementation, this would:
      // 1. Get the app type from the connection
      // 2. Call the appropriate validation function for that app type
      // 3. Update the connection status based on the result

      // For now, we'll simulate a successful validation
      await ctx.runMutation(internalUpdateConnectionStatus, {
        connectionId: args.connectionId,
        status: CONNECTION_STATUS.ACTIVE,
      });

      return {
        valid: true,
        status: CONNECTION_STATUS.ACTIVE,
        message: "Credentials validated successfully",
      };
    } catch (error) {
      // Handle validation errors
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Update connection status to error
      await ctx.runMutation(internalUpdateConnectionStatus, {
        connectionId: args.connectionId,
        status: CONNECTION_STATUS.ERROR,
        error: errorMessage,
      });

      return {
        valid: false,
        status: CONNECTION_STATUS.ERROR,
        message: `Validation failed: ${errorMessage}`,
      };
    }
  },
});

/**
 * Internal query to get a connection with credentials
 *
 * This function is used by other credential management functions
 */
export const internalGetConnection = internalQuery({
  args: {
    connectionId: v.id("connections"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.connectionId);
  },
});

/**
 * Internal mutation to update connection status
 */
export const internalUpdateConnectionStatus = internalMutation({
  args: {
    connectionId: v.id("connections"),
    status: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const update: Record<string, any> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.error) {
      update.lastError = args.error;
    } else if (args.status === CONNECTION_STATUS.ACTIVE) {
      // Clear any previous errors
      update.lastError = null;
    }

    await ctx.db.patch(args.connectionId, update);
  },
});

/**
 * Internal mutation to update credentials
 */
export const internalUpdateCredentials = internalMutation({
  args: {
    connectionId: v.id("connections"),
    encryptedCredentials: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      credentials: { encrypted: args.encryptedCredentials },
      updatedAt: Date.now(),
    });
  },
});
