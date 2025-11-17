import { z } from "zod";

import type {
  ConnectionDefinition,
  IntegrationNodeDefinition,
} from "@acme/integration-sdk";

const wordpressSettingsSchema = z.object({
  action: z.enum(["create_post", "update_post", "get_posts"]),
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  status: z.enum(["publish", "draft", "private"]).default("draft"),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const wordpressConnectionDefinition: ConnectionDefinition = {
  id: "wordpress",
  name: "WordPress",
  type: "basic_auth",
  authSchema: z.object({
    baseUrl: z.string().url("Must be a valid WordPress site URL"),
    username: z.string().min(1, "Username is required"),
    applicationPassword: z.string().min(1, "Application password is required"),
  }),
  async testConnection(auth) {
    try {
      const authData = auth as {
        baseUrl: string;
        username: string;
        applicationPassword: string;
      };
      const response = await fetch(
        `${authData.baseUrl}/wp-json/wp/v2/users/me`,
        {
          headers: {
            Authorization: `Basic ${btoa(`${authData.username}:${authData.applicationPassword}`)}`,
          },
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  },
};

export const wordpressNodeDefinition: IntegrationNodeDefinition = {
  metadata: {
    id: "external.wordpress",
    name: "WordPress",
    description: "Interact with WordPress sites via REST API",
    type: "external",
    category: "cms",
    version: "1.0.0",
    icon: "FileText",
    color: "#21759B",
  },

  configSchema: {
    input: z.object({
      postData: z
        .object({
          title: z.string(),
          content: z.string().optional(),
          status: z.string().optional(),
        })
        .optional(),
    }),
    output: z.object({
      success: z.boolean(),
      postId: z.number().optional(),
      postUrl: z.string().optional(),
      error: z.string().optional(),
    }),
    settings: wordpressSettingsSchema,
  },

  async execute(context) {
    const { settings, inputData, connections } = context;
    const connection = connections.wordpress;

    if (!connection) {
      return {
        success: false,
        error: "WordPress connection not configured",
      };
    }

    try {
      const { baseUrl, username, applicationPassword } = connection;
      const postData = (inputData as any)?.postData || {};

      // Merge settings with input data
      const requestData = {
        title: postData.title || settings.title,
        content: postData.content || settings.content || "",
        status: postData.status || settings.status || "draft",
        categories: settings.categories || [],
        tags: settings.tags || [],
      };

      const response = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${username}:${applicationPassword}`)}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          success: true,
          postId: result.id,
          postUrl: result.link,
        },
        logs: [
          `Created WordPress post: ${result.title.rendered}`,
          `Post ID: ${result.id}`,
          `Status: ${result.status}`,
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        logs: ["Failed to create WordPress post"],
      };
    }
  },

  async validate(settings) {
    try {
      wordpressSettingsSchema.parse(settings);
      return true;
    } catch {
      return false;
    }
  },
};
