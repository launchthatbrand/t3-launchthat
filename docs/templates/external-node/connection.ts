import { z } from "zod";

import type { ConnectionDefinition } from "../../../packages/integration-sdk/src/node-types.js";

/**
 * External Node Connection Template
 *
 * This file defines the connection configuration for authenticating with the external service.
 * Choose the appropriate authentication method for your service.
 */

// =====================================================
// API KEY AUTHENTICATION (Most Common)
// =====================================================

const ApiKeyAuthSchema = z.object({
  baseUrl: z.string().url("Must be a valid URL"),
  apiKey: z.string().min(1, "API key is required"),
});

export const ServiceNameApiKeyConnection: ConnectionDefinition = {
  id: "service-name-api-key",
  name: "Service Name (API Key)",
  type: "api_key",
  authSchema: ApiKeyAuthSchema,

  async testConnection(auth: unknown): Promise<boolean> {
    try {
      const { baseUrl, apiKey } = ApiKeyAuthSchema.parse(auth);

      // Test the connection by making a simple API call
      const response = await fetch(`${baseUrl}/api/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("API Key connection test failed:", error);
      return false;
    }
  },

  ui: {
    description: "Connect to Service Name using an API key",
    instructions:
      "You can find your API key in your Service Name dashboard under Settings > API Keys",
    fields: [
      {
        key: "baseUrl",
        label: "Base URL",
        type: "url",
        description: "Your Service Name instance URL",
        required: true,
        placeholder: "https://api.servicename.com",
      },
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        description: "Your Service Name API key",
        required: true,
        placeholder: "sk_live_...",
      },
    ],
  },
};

// =====================================================
// BASIC AUTHENTICATION
// =====================================================

const BasicAuthSchema = z.object({
  baseUrl: z.string().url("Must be a valid URL"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const ServiceNameBasicConnection: ConnectionDefinition = {
  id: "service-name-basic",
  name: "Service Name (Username/Password)",
  type: "basic_auth",
  authSchema: BasicAuthSchema,

  async testConnection(auth: unknown): Promise<boolean> {
    try {
      const { baseUrl, username, password } = BasicAuthSchema.parse(auth);

      const response = await fetch(`${baseUrl}/api/me`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Basic auth connection test failed:", error);
      return false;
    }
  },

  ui: {
    description: "Connect to Service Name using username and password",
    instructions: "Use your Service Name account credentials",
    fields: [
      {
        key: "baseUrl",
        label: "Base URL",
        type: "url",
        description: "Your Service Name instance URL",
        required: true,
        placeholder: "https://your-instance.servicename.com",
      },
      {
        key: "username",
        label: "Username",
        type: "text",
        description: "Your Service Name username",
        required: true,
        placeholder: "your-username",
      },
      {
        key: "password",
        label: "Password",
        type: "password",
        description: "Your Service Name password",
        required: true,
        placeholder: "Your password",
      },
    ],
  },
};

// =====================================================
// OAUTH2 AUTHENTICATION
// =====================================================

const OAuth2AuthSchema = z.object({
  baseUrl: z.string().url("Must be a valid URL"),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenType: z.string().default("Bearer"),
  expiresAt: z.number().optional(),
});

export const ServiceNameOAuth2Connection: ConnectionDefinition = {
  id: "service-name-oauth2",
  name: "Service Name (OAuth2)",
  type: "oauth2",
  authSchema: OAuth2AuthSchema,

  // OAuth2 configuration
  oauth2Config: {
    authorizationUrl: "https://api.servicename.com/oauth/authorize",
    tokenUrl: "https://api.servicename.com/oauth/token",
    scopes: ["read", "write"],
    additionalParams: {
      response_type: "code",
    },
  },

  async testConnection(auth: unknown): Promise<boolean> {
    try {
      const { baseUrl, accessToken, tokenType } = OAuth2AuthSchema.parse(auth);

      if (!accessToken) {
        return false;
      }

      const response = await fetch(`${baseUrl}/api/me`, {
        method: "GET",
        headers: {
          Authorization: `${tokenType} ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("OAuth2 connection test failed:", error);
      return false;
    }
  },

  ui: {
    description: "Connect to Service Name using OAuth2",
    instructions:
      "Click 'Connect' to authorize access to your Service Name account",
    fields: [
      {
        key: "baseUrl",
        label: "Base URL",
        type: "url",
        description: "Your Service Name instance URL",
        required: true,
        placeholder: "https://api.servicename.com",
      },
    ],
  },
};

// =====================================================
// BEARER TOKEN AUTHENTICATION
// =====================================================

const BearerTokenAuthSchema = z.object({
  baseUrl: z.string().url("Must be a valid URL"),
  token: z.string().min(1, "Bearer token is required"),
});

export const ServiceNameBearerConnection: ConnectionDefinition = {
  id: "service-name-bearer",
  name: "Service Name (Bearer Token)",
  type: "bearer_token",
  authSchema: BearerTokenAuthSchema,

  async testConnection(auth: unknown): Promise<boolean> {
    try {
      const { baseUrl, token } = BearerTokenAuthSchema.parse(auth);

      const response = await fetch(`${baseUrl}/api/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Bearer token connection test failed:", error);
      return false;
    }
  },

  ui: {
    description: "Connect to Service Name using a bearer token",
    instructions: "Generate a bearer token from your Service Name dashboard",
    fields: [
      {
        key: "baseUrl",
        label: "Base URL",
        type: "url",
        description: "Your Service Name API endpoint",
        required: true,
        placeholder: "https://api.servicename.com",
      },
      {
        key: "token",
        label: "Bearer Token",
        type: "password",
        description: "Your Service Name bearer token",
        required: true,
        placeholder: "your-bearer-token",
      },
    ],
  },
};

// =====================================================
// CUSTOM AUTHENTICATION (Advanced)
// =====================================================

const CustomAuthSchema = z.object({
  baseUrl: z.string().url("Must be a valid URL"),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client secret is required"),
  apiVersion: z.string().default("v1"),
  customParam: z.string().optional(),
});

export const ServiceNameCustomConnection: ConnectionDefinition = {
  id: "service-name-custom",
  name: "Service Name (Custom Auth)",
  type: "custom",
  authSchema: CustomAuthSchema,

  async testConnection(auth: unknown): Promise<boolean> {
    try {
      const { baseUrl, clientId, clientSecret, apiVersion } =
        CustomAuthSchema.parse(auth);

      // Custom authentication logic
      // This example shows a custom JWT-based auth
      const authPayload = {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      };

      // First, get an access token
      const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authPayload),
      });

      if (!tokenResponse.ok) {
        return false;
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Test the token with a simple API call
      const testResponse = await fetch(`${baseUrl}/api/${apiVersion}/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return testResponse.ok;
    } catch (error) {
      console.error("Custom auth connection test failed:", error);
      return false;
    }
  },

  ui: {
    description: "Connect to Service Name using custom authentication",
    instructions:
      "Use your Service Name app credentials for secure authentication",
    fields: [
      {
        key: "baseUrl",
        label: "Base URL",
        type: "url",
        description: "Your Service Name API endpoint",
        required: true,
        placeholder: "https://api.servicename.com",
      },
      {
        key: "clientId",
        label: "Client ID",
        type: "text",
        description: "Your Service Name application client ID",
        required: true,
        placeholder: "your-client-id",
      },
      {
        key: "clientSecret",
        label: "Client Secret",
        type: "password",
        description: "Your Service Name application client secret",
        required: true,
        placeholder: "your-client-secret",
      },
      {
        key: "apiVersion",
        label: "API Version",
        type: "select",
        description: "Service Name API version to use",
        required: false,
        options: [
          { value: "v1", label: "Version 1" },
          { value: "v2", label: "Version 2" },
          { value: "beta", label: "Beta" },
        ],
      },
      {
        key: "customParam",
        label: "Custom Parameter",
        type: "text",
        description: "Optional custom parameter for advanced configurations",
        required: false,
        placeholder: "custom-value",
      },
    ],
  },
};

// =====================================================
// DEFAULT CONNECTION (Choose the most appropriate one)
// =====================================================

// Export the most commonly used connection type as default
// Change this to match your service's primary authentication method
export const ServiceNameConnection = ServiceNameApiKeyConnection;

// Export all connection types for flexibility
export const ServiceNameConnections = {
  apiKey: ServiceNameApiKeyConnection,
  basic: ServiceNameBasicConnection,
  oauth2: ServiceNameOAuth2Connection,
  bearer: ServiceNameBearerConnection,
  custom: ServiceNameCustomConnection,
};

// Default export
export default ServiceNameConnection;
