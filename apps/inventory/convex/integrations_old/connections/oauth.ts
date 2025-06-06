/**
 * OAuth authentication flows for the integrations module
 *
 * This file provides functions for implementing OAuth authentication
 * for various third-party services.
 */
import { ConvexError, v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
} from "../../_generated/server";
import { security } from "../lib";
import { CONNECTION_STATUS } from "../lib/validators";

/**
 * Generate an OAuth2 authorization URL
 */
export const generateAuthUrl = action({
  args: {
    appId: v.id("apps"),
    redirectUri: v.string(),
    state: v.string(),
    scope: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { appId, redirectUri, state, scope } = args;

    // Get the app configuration
    const app = await ctx.runQuery(internalGetAppById, { appId });

    if (!app) {
      throw new ConvexError({
        code: "not_found",
        message: "App not found",
      });
    }

    // Ensure the app uses OAuth2
    if (app.authType !== "oauth2") {
      throw new ConvexError({
        code: "invalid_argument",
        message: "This app does not use OAuth2 authentication",
      });
    }

    // Check that OAuth2 configuration exists
    const authConfig = app.authConfig as {
      authUrl?: string;
      clientId?: string;
      scope?: string;
    };

    if (!authConfig.authUrl || !authConfig.clientId) {
      throw new ConvexError({
        code: "invalid_argument",
        message: "Invalid OAuth2 configuration: missing authUrl or clientId",
      });
    }

    // Store the OAuth state in a temporary database record or session
    // to validate it when the user returns from the OAuth provider
    await ctx.runMutation(storeOAuthState, {
      appId,
      state,
      redirectUri,
    });

    // Build the authorization URL
    const authUrl = new URL(authConfig.authUrl);
    authUrl.searchParams.append("client_id", authConfig.clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("response_type", "code");

    // Add scope if provided or use the default from app config
    const scopeValue = scope || authConfig.scope || "";
    if (scopeValue) {
      authUrl.searchParams.append("scope", scopeValue);
    }

    return authUrl.toString();
  },
});

/**
 * Store OAuth state for validation
 */
export const storeOAuthState = internalMutation({
  args: {
    appId: v.id("apps"),
    state: v.string(),
    redirectUri: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { appId, state, redirectUri } = args;

    // Store the state with an expiration time (30 minutes)
    const expiresAt = Date.now() + 30 * 60 * 1000;

    // In a real implementation, we would store this in a database table
    // For now, we'll use a temporary storage solution
    const stateId = await ctx.db.insert("temp_oauth_states", {
      appId,
      state,
      redirectUri,
      expiresAt,
      createdAt: Date.now(),
    });

    return stateId;
  },
});

/**
 * Handle OAuth2 callback and exchange code for tokens
 */
export const handleOAuthCallback = action({
  args: {
    code: v.string(),
    state: v.string(),
    error: v.optional(v.string()),
    connectionName: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    connectionId: v.optional(v.id("connections")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { code, state, error, connectionName } = args;

    // If the OAuth provider returned an error
    if (error) {
      return {
        success: false,
        error: `OAuth error: ${error}`,
      };
    }

    // Validate the state parameter to prevent CSRF attacks
    const stateRecord = await ctx.runQuery(getOAuthStateByValue, { state });

    if (!stateRecord) {
      return {
        success: false,
        error: "Invalid or expired OAuth state",
      };
    }

    // Check if the state has expired
    if (stateRecord.expiresAt < Date.now()) {
      return {
        success: false,
        error: "OAuth state has expired",
      };
    }

    try {
      // Get the app configuration
      const app = await ctx.runQuery(internalGetAppById, {
        appId: stateRecord.appId,
      });

      if (!app) {
        return {
          success: false,
          error: "App not found",
        };
      }

      // Exchange the authorization code for tokens
      const authConfig = app.authConfig as {
        tokenUrl?: string;
        clientId?: string;
        clientSecret?: string;
      };

      if (
        !authConfig.tokenUrl ||
        !authConfig.clientId ||
        !authConfig.clientSecret
      ) {
        return {
          success: false,
          error: "Invalid OAuth2 configuration",
        };
      }

      // Prepare the token request
      const tokenRequest = new URLSearchParams();
      tokenRequest.append("grant_type", "authorization_code");
      tokenRequest.append("code", code);
      tokenRequest.append("redirect_uri", stateRecord.redirectUri);
      tokenRequest.append("client_id", authConfig.clientId);
      tokenRequest.append("client_secret", authConfig.clientSecret);

      // Make the token request
      const tokenResponse = await fetch(authConfig.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: tokenRequest.toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        return {
          success: false,
          error: `Failed to exchange code for token: ${errorText}`,
        };
      }

      // Parse the token response
      const tokenData = await tokenResponse.json();

      // Store the tokens securely
      const credentials = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type || "Bearer",
        expiresIn: tokenData.expires_in,
        expiresAt: tokenData.expires_in
          ? Date.now() + tokenData.expires_in * 1000
          : undefined,
        scope: tokenData.scope,
        rawResponse: tokenData, // Store the full response for reference
      };

      // Create a new connection record
      const connectionId = await ctx.runMutation(createOAuthConnection, {
        appId: stateRecord.appId,
        name: connectionName,
        credentials,
      });

      // Delete the temporary state record
      await ctx.runMutation(deleteOAuthState, { stateId: stateRecord._id });

      return {
        success: true,
        connectionId,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during OAuth flow",
      };
    }
  },
});

/**
 * Get OAuth state by value
 */
export const getOAuthStateByValue = internalQuery({
  args: {
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const states = await ctx.db
      .query("temp_oauth_states")
      .filter((q) => q.eq(q.field("state"), args.state))
      .collect();

    return states.length > 0 ? states[0] : null;
  },
});

/**
 * Delete OAuth state after use
 */
export const deleteOAuthState = internalMutation({
  args: {
    stateId: v.id("temp_oauth_states"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.stateId);
  },
});

/**
 * Create a new connection with OAuth credentials
 */
export const createOAuthConnection = internalMutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    credentials: v.object({}),
  },
  returns: v.id("connections"),
  handler: async (ctx, args) => {
    const { appId, name, credentials } = args;

    // Encrypt the credentials
    const encryptedCredentials = security.encryptData(
      JSON.stringify(credentials),
    );

    if (!encryptedCredentials) {
      throw new ConvexError("Failed to encrypt credentials");
    }

    // Create the connection record
    const connectionId = await ctx.db.insert("connections", {
      appId,
      userId: ctx.auth.userId as Id<"users">,
      name,
      status: CONNECTION_STATUS.ACTIVE,
      credentials: { encrypted: encryptedCredentials },
      updatedAt: Date.now(),
      lastUsed: Date.now(),
      metadata: {},
    });

    return connectionId;
  },
});

/**
 * Refresh an OAuth2 access token
 */
export const refreshOAuthToken = action({
  args: {
    connectionId: v.id("connections"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { connectionId } = args;

    try {
      // Get the connection
      const connection = await ctx.runQuery(internalGetConnectionById, {
        connectionId,
      });

      if (!connection) {
        return {
          success: false,
          error: "Connection not found",
        };
      }

      // Get the app configuration
      const app = await ctx.runQuery(internalGetAppById, {
        appId: connection.appId,
      });

      if (!app) {
        return {
          success: false,
          error: "App not found",
        };
      }

      // Ensure the app uses OAuth2
      if (app.authType !== "oauth2") {
        return {
          success: false,
          error: "This app does not use OAuth2 authentication",
        };
      }

      // Decrypt the credentials
      const credentials = connection.credentials as { encrypted?: string };
      const encryptedData = credentials.encrypted;
      if (!encryptedData) {
        return {
          success: false,
          error: "No credentials found",
        };
      }

      const decryptedJson = security.decryptData(encryptedData);
      if (!decryptedJson) {
        return {
          success: false,
          error: "Failed to decrypt credentials",
        };
      }

      // Parse the credentials
      const tokenCredentials = JSON.parse(decryptedJson) as {
        refreshToken?: string;
        tokenType?: string;
        scope?: string;
      };

      // Check if we have a refresh token
      if (!tokenCredentials.refreshToken) {
        return {
          success: false,
          error: "No refresh token available",
        };
      }

      // Get the OAuth2 configuration
      const authConfig = app.authConfig as {
        refreshUrl?: string;
        tokenUrl?: string;
        clientId?: string;
        clientSecret?: string;
      };

      // Prepare the refresh token request
      const refreshUrl = authConfig.refreshUrl || authConfig.tokenUrl;
      if (!refreshUrl) {
        return {
          success: false,
          error: "No refresh URL configured",
        };
      }

      const refreshRequest = new URLSearchParams();
      refreshRequest.append("grant_type", "refresh_token");
      refreshRequest.append("refresh_token", tokenCredentials.refreshToken);
      refreshRequest.append("client_id", authConfig.clientId || "");
      refreshRequest.append("client_secret", authConfig.clientSecret || "");

      // Make the refresh request
      const refreshResponse = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: refreshRequest.toString(),
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        return {
          success: false,
          error: `Failed to refresh token: ${errorText}`,
        };
      }

      // Parse the refresh response
      const tokenData = await refreshResponse.json();

      // Update the credentials
      const updatedCredentials = {
        ...tokenCredentials,
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type || tokenCredentials.tokenType,
        expiresIn: tokenData.expires_in,
        expiresAt: tokenData.expires_in
          ? Date.now() + tokenData.expires_in * 1000
          : undefined,
        // Only update refresh token if a new one was provided
        refreshToken: tokenData.refresh_token || tokenCredentials.refreshToken,
        scope: tokenData.scope || tokenCredentials.scope,
        rawResponse: tokenData, // Store the full response for reference
      };

      // Encrypt and store the updated credentials
      const encryptedCredentials = security.encryptData(
        JSON.stringify(updatedCredentials),
      );

      if (!encryptedCredentials) {
        return {
          success: false,
          error: "Failed to encrypt updated credentials",
        };
      }

      // Update the connection record
      await ctx.runMutation(updateOAuthCredentials, {
        connectionId,
        encryptedCredentials,
        status: CONNECTION_STATUS.ACTIVE,
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during token refresh",
      };
    }
  },
});

/**
 * Internal query to get an app by ID
 */
export const internalGetAppById = internalQuery({
  args: {
    appId: v.id("apps"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.appId);
  },
});

/**
 * Internal query to get a connection by ID
 */
export const internalGetConnectionById = internalQuery({
  args: {
    connectionId: v.id("connections"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.connectionId);
  },
});

/**
 * Internal mutation to update OAuth credentials
 */
export const updateOAuthCredentials = internalMutation({
  args: {
    connectionId: v.id("connections"),
    encryptedCredentials: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      credentials: { encrypted: args.encryptedCredentials },
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
