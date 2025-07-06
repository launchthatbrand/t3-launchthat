/* eslint-disable @typescript-eslint/no-unused-vars */
"use node";

import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { api } from "../../_generated/api";
import { action } from "../../_generated/server";
import { httpFetch } from "../lib/httpFetch";

/**
 * Test a node by making an HTTP request to the external API through the Convex backend
 * This solves CORS issues by proxying the request through the server
 */
export const testNode = action({
  args: {
    nodeId: v.string(),
    connectionId: v.string(),
    action: v.string(),
    appName: v.string(),
    config: v.optional(v.any()),
  },
  returns: v.object({
    data: v.optional(v.any()),
    schema: v.array(v.string()),
    requestInfo: v.optional(
      v.object({
        endpoint: v.string(),
        method: v.string(),
        headers: v.optional(v.any()),
      }),
    ),
    responseInfo: v.optional(
      v.object({
        statusCode: v.number(),
        statusText: v.string(),
        timing: v.number(),
      }),
    ),
    error: v.optional(v.string()),
    isProxied: v.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      console.log(
        `Testing node ${args.nodeId} with action ${args.action} on app ${args.appName}`,
      );

      // Get the connection details from the database
      let connectionId: Id<"connections">;
      try {
        connectionId = args.connectionId as Id<"connections">;
      } catch {
        throw new Error(`Invalid connection ID: ${args.connectionId}`);
      }

      const connection = await ctx.runQuery(
        api.integrations.connections.queries.get,
        {
          id: connectionId,
        },
      );

      if (!connection) {
        throw new Error(`Connection with ID ${args.connectionId} not found`);
      }

      console.log("Connection:", connection);

      // Extract credentials from the connection
      let credentials: Record<string, unknown> = {};

      // Use the credentials field instead of config
      if (connection.credentials) {
        console.log("Connection credentials:", connection.credentials);
        try {
          // Parse the credentials (it should be a JSON string)
          if (typeof connection.credentials === "string") {
            const parsedCredentials = JSON.parse(
              connection.credentials,
            ) as Record<string, unknown>;
            credentials = parsedCredentials;
          } else {
            // If it's already an object, use it directly
            credentials = connection.credentials as Record<string, unknown>;
          }
        } catch (error) {
          console.error("Error parsing connection credentials:", error);
          // Continue with empty credentials if parsing fails
        }
      }

      console.log("Using connection:", connection.name);

      // Configure request parameters based on app type and action
      let endpoint = "";
      let method = "GET";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      let body: Record<string, unknown> | undefined;

      // Set up endpoint and method based on app type and connection credentials
      const appType = args.appName.toLowerCase();

      if (appType === "wordpress") {
        // For WordPress, use the connection credentials
        const wpCredentials = credentials as {
          siteUrl?: string;
          apiUsername?: string;
          apiKey?: string;
        };

        // Validate WordPress credentials
        if (!wpCredentials.siteUrl) {
          console.error(
            "WordPress connection is missing siteUrl:",
            wpCredentials,
          );
          throw new Error(
            "WordPress site URL not found in connection credentials. Please update the connection configuration with a valid site URL.",
          );
        }

        const siteUrl = wpCredentials.siteUrl.replace(/\/$/, ""); // Remove trailing slash if present

        // Add authentication to headers if provided
        if (wpCredentials.apiUsername && wpCredentials.apiKey) {
          const authString = `${wpCredentials.apiUsername}:${wpCredentials.apiKey}`;
          const base64Auth = Buffer.from(authString).toString("base64");
          headers.Authorization = `Basic ${base64Auth}`;
        }

        if (args.action === "wp_get_users") {
          endpoint = `${siteUrl}/wp-json/wp/v2/users`;
        } else if (args.action === "wp_get_posts") {
          endpoint = `${siteUrl}/wp-json/wp/v2/posts?_embed=true&per_page=1`;
        }
      } else if (appType === "monday") {
        // For Monday.com, use the connection credentials
        const mondayCredentials = credentials as {
          apiKey?: string;
          apiUrl?: string;
        };

        if (!mondayCredentials.apiUrl) {
          // Default Monday API URL if not specified
          endpoint = "https://api.monday.com/v2";
        } else {
          endpoint = mondayCredentials.apiUrl;
        }

        // Add API key to headers if provided
        if (mondayCredentials.apiKey) {
          headers.Authorization = mondayCredentials.apiKey;
        }

        // For demo purposes, use a public API if no credentials
        if (!mondayCredentials.apiKey) {
          endpoint = "https://jsonplaceholder.typicode.com/users/1";
        }
      } else if (appType === "vimeo") {
        // Vimeo integration – use the access token stored in connection credentials
        const vimeoCredentials = credentials as {
          accessToken?: string;
          access_token?: string; // raw Vimeo field name
        };

        const token =
          vimeoCredentials.accessToken ?? vimeoCredentials.access_token;

        if (!token) {
          throw new Error(
            "Vimeo access token not found in connection credentials. Please reconnect Vimeo.",
          );
        }

        headers.Authorization = `Bearer ${token}`;

        if (args.action === "vimeo_get_videos") {
          // Support folder filtering
          let folderPart = "";
          let firstFolder: string | undefined;
          if (args.config?.folderIds) {
            if (Array.isArray(args.config.folderIds)) {
              firstFolder = args.config.folderIds[0];
            } else if (typeof args.config.folderIds === "string") {
              firstFolder = args.config.folderIds.split(",")[0]?.trim();
            }
            if (firstFolder) folderPart = `/projects/${firstFolder}`;
          }

          // Fetch first page with 1 item for testing, optionally scoped to a folder
          endpoint = `https://api.vimeo.com/me${folderPart}/videos?per_page=1`;
        }
      } else if (appType === "calendar") {
        // Calendar credentials and endpoints would go here
        // For now, use a placeholder
        endpoint = "https://jsonplaceholder.typicode.com/users/1";
      } else if (appType === "webhook") {
        // Webhook credentials and endpoints would go here
        // For now, use a placeholder
        endpoint = "https://jsonplaceholder.typicode.com/posts/1";
      } else if (appType === "this website") {
        // This Website internal API testing endpoints
        // For testing purposes, we'll simulate various creation actions

        method = "POST"; // All creation actions use POST
        const baseUrl = "/api/integrations"; // Base URL for internal API

        if (args.action === "create_post") {
          endpoint = `${baseUrl}/posts`;
          body = {
            title: "Test Post Title",
            content: "This is test content for a post created via integration",
            status: "draft",
            author: "integration-test",
          };
        } else if (args.action === "create_user") {
          endpoint = `${baseUrl}/users`;
          body = {
            name: "Test Integration User",
            email: "test-integration@example.com",
            role: "member",
          };
        } else if (args.action === "create_download") {
          endpoint = `${baseUrl}/downloads`;
          body = {
            name: "Test Download",
            description: "This is a test download file",
            fileType: "pdf",
            access: "public",
          };
        } else if (args.action === "create_product") {
          endpoint = `${baseUrl}/products`;
          body = {
            name: "Test Product",
            description: "This is a test product created via integration",
            price: 29.99,
            currency: "USD",
            status: "draft",
          };
        }
      }

      // If no specific endpoint is configured, throw an error
      if (!endpoint) {
        throw new Error(
          `No endpoint configured for app type: ${appType} with action: ${args.action}`,
        );
      }

      // Store request information
      const requestInfo = {
        endpoint,
        method,
        headers,
      };

      // Make the actual HTTP request
      console.log(`Making ${method} request to ${endpoint}`);
      const startTime = Date.now();

      // Use our httpFetch utility to make the request
      const response = await httpFetch(endpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const endTime = Date.now();
      const requestDuration = endTime - startTime;

      // Process the response
      let responseData: unknown;
      try {
        const jsonText = await response.text();
        responseData = JSON.parse(jsonText);
      } catch (jsonError) {
        throw new Error(
          `Failed to parse JSON response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
        );
      }

      // Store response information
      const responseInfo = {
        statusCode: response.status,
        statusText: response.statusText,
        timing: requestDuration,
      };

      // Extract schema from the response
      const dataToAnalyze: Record<string, unknown> =
        Array.isArray(responseData) && responseData.length > 0
          ? (responseData[0] as Record<string, unknown>)
          : (responseData as Record<string, unknown>);

      const schema = extractPaths(dataToAnalyze);

      // Return the result
      return {
        data: dataToAnalyze,
        schema,
        requestInfo,
        responseInfo,
        isProxied: true,
        error: response.ok
          ? undefined
          : `API returned error status: ${response.status} ${response.statusText}`,
      };
    } catch (error) {
      console.error("Error testing node:", error);

      // Return error with mock data as fallback
      const mockData = getMockData(args.appName.toLowerCase(), args.action);

      return {
        data: mockData,
        schema: mockData ? extractPaths(mockData) : [],
        isProxied: false,
        error:
          error instanceof Error
            ? `API call failed: ${error.message}`
            : "Unknown error testing node",
      };
    }
  },
});

/**
 * Get mock data based on app type and action (fallback for errors)
 */
function getMockData(
  appType: string,
  action: string,
): Record<string, unknown> | null {
  if (appType === "wordpress") {
    if (action === "wp_get_users") {
      return {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        username: "johndoe",
        role: "administrator",
        registered_date: "2023-01-15T08:30:00",
        url: "https://example.com/author/johndoe",
        avatar_url: "https://secure.gravatar.com/avatar/...",
        posts_count: 24,
        meta: {
          last_login: "2023-06-10T14:22:00",
          location: "New York",
        },
      };
    } else if (action === "wp_get_posts") {
      return {
        id: 42,
        date: "2023-05-15T10:00:00",
        title: {
          rendered: "Sample Blog Post",
        },
        content: {
          rendered: "<p>This is a sample blog post content.</p>",
        },
        excerpt: {
          rendered: "<p>This is a sample excerpt...</p>",
        },
        author: 1,
        featured_media: 123,
        categories: [4, 7],
        tags: [12, 15, 18],
        status: "publish",
        comment_status: "open",
        meta: {
          views: 1542,
          reading_time: "5 min",
        },
      };
    }
  } else if (appType === "this website") {
    if (action === "create_post") {
      return {
        id: "post_abc123",
        title: "Test Post Title",
        content: "This is test content for a post created via integration",
        status: "draft",
        author: "integration-test",
        createdAt: new Date().toISOString(),
        url: "/posts/test-post-title",
        success: true,
        message: "Post created successfully",
      };
    } else if (action === "create_user") {
      return {
        id: "user_xyz789",
        name: "Test Integration User",
        email: "test-integration@example.com",
        role: "member",
        createdAt: new Date().toISOString(),
        success: true,
        message: "User created successfully",
      };
    } else if (action === "create_download") {
      return {
        id: "download_123456",
        name: "Test Download",
        description: "This is a test download file",
        fileType: "pdf",
        access: "public",
        url: "/downloads/test-download",
        createdAt: new Date().toISOString(),
        size: 1024,
        success: true,
        message: "Download created successfully",
      };
    } else if (action === "create_product") {
      return {
        id: "product_789012",
        name: "Test Product",
        description: "This is a test product created via integration",
        price: 29.99,
        currency: "USD",
        status: "draft",
        createdAt: new Date().toISOString(),
        slug: "test-product",
        success: true,
        message: "Product created successfully",
      };
    }
  }

  if (appType === "vimeo") {
    if (action === "vimeo_get_videos") {
      return {
        total: 1,
        data: [
          {
            id: "v_123",
            name: "Sample Vimeo Video",
            embedUrl: "https://player.vimeo.com/video/123",
          },
        ],
      } as unknown as Record<string, unknown>;
    }
  }

  // Default mock data
  return {
    id: 1,
    name: "Sample Data",
    type: "default",
    timestamp: new Date().toISOString(),
    note: "This is fallback data due to an API error",
  };
}

// Helper to recursively extract dot-notation paths from nested objects/arrays
function extractPaths(value: unknown, parent: string = ""): string[] {
  const paths: string[] = [];
  if (Array.isArray(value)) {
    if (value.length === 0) return paths;
    // For arrays, analyse only the first element to infer schema
    const child = value[0];
    const arrayPrefix = parent ? `${parent}[]` : "[]";
    if (typeof child === "object" && child !== null) {
      const childPaths = extractPaths(child, arrayPrefix);
      paths.push(...childPaths);
    } else {
      // Primitive array – just record the parent path as an array
      paths.push(arrayPrefix);
    }
  } else if (typeof value === "object" && value !== null) {
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      const newPrefix = parent ? `${parent}.${key}` : key;
      if (val !== null && (Array.isArray(val) || typeof val === "object")) {
        paths.push(...extractPaths(val, newPrefix));
      } else {
        paths.push(newPrefix);
      }
    });
  } else if (parent) {
    // Primitive value at root
    paths.push(parent);
  }
  return paths;
}
