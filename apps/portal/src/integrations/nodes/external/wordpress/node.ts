import { z } from "zod";

import type {
  ConnectionDefinition,
  IntegrationNodeDefinition,
  NodeExecutionContext,
  NodeExecutionResult,
} from "@acme/integration-sdk";

// ==================== SCHEMAS ====================

export const WordPressInputSchema = z.object({
  action: z.enum(["create_post", "update_post", "get_posts", "delete_post"]),
  postData: z
    .object({
      title: z.string().min(1, "Title is required"),
      content: z.string().optional(),
      status: z.enum(["publish", "draft", "private"]).default("draft"),
      excerpt: z.string().optional(),
      categories: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      featured_media: z.number().optional(),
      slug: z.string().optional(),
    })
    .optional(),
  postId: z.number().optional(), // For update/delete operations
  query: z
    .object({
      per_page: z.number().max(100).default(10),
      page: z.number().default(1),
      status: z.enum(["publish", "draft", "private", "any"]).default("publish"),
      search: z.string().optional(),
    })
    .optional(), // For get_posts operation
});

export const WordPressOutputSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      post: z
        .object({
          id: z.number(),
          title: z.string(),
          content: z.string(),
          status: z.string(),
          link: z.string().url(),
          excerpt: z.string(),
          date: z.string(),
          modified: z.string(),
        })
        .optional(),
      posts: z
        .array(
          z.object({
            id: z.number(),
            title: z.string(),
            excerpt: z.string(),
            link: z.string().url(),
            status: z.string(),
            date: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
  error: z.string().optional(),
});

// ==================== CONNECTION DEFINITION ====================

export const WordPressConnectionDefinition: ConnectionDefinition = {
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

      if (!response.ok) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },
};

// ==================== WORDPRESS NODE FUNCTIONS ====================

async function makeWordPressRequest(
  baseUrl: string,
  endpoint: string,
  method: string,
  auth: { username: string; applicationPassword: string },
  data?: any,
): Promise<any> {
  const url = `${baseUrl}${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Basic ${btoa(`${auth.username}:${auth.applicationPassword}`)}`,
  };

  if (data && (method === "POST" || method === "PUT")) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WordPress API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function createPost(
  baseUrl: string,
  auth: { username: string; applicationPassword: string },
  postData: any,
): Promise<NodeExecutionResult> {
  const requestData = {
    title: postData.title,
    content: postData.content || "",
    status: postData.status || "draft",
    excerpt: postData.excerpt || "",
    categories: postData.categories || [],
    tags: postData.tags || [],
    slug: postData.slug,
    featured_media: postData.featured_media,
  };

  const response = await makeWordPressRequest(
    baseUrl,
    "/wp-json/wp/v2/posts",
    "POST",
    auth,
    requestData,
  );

  return {
    success: true,
    data: {
      post: {
        id: response.id,
        title: response.title.rendered,
        content: response.content.rendered,
        status: response.status,
        link: response.link,
        excerpt: response.excerpt.rendered,
        date: response.date,
        modified: response.modified,
      },
    },
    logs: [
      `Created WordPress post: ${response.title.rendered}`,
      `Post ID: ${response.id}`,
      `Status: ${response.status}`,
    ],
  };
}

async function updatePost(
  baseUrl: string,
  auth: { username: string; applicationPassword: string },
  postId: number,
  postData: any,
): Promise<NodeExecutionResult> {
  const requestData = {
    title: postData.title,
    content: postData.content,
    status: postData.status,
    excerpt: postData.excerpt,
    categories: postData.categories,
    tags: postData.tags,
    slug: postData.slug,
    featured_media: postData.featured_media,
  };

  // Remove undefined values
  Object.keys(requestData).forEach((key) => {
    if (requestData[key as keyof typeof requestData] === undefined) {
      delete requestData[key as keyof typeof requestData];
    }
  });

  const response = await makeWordPressRequest(
    baseUrl,
    `/wp-json/wp/v2/posts/${postId}`,
    "PUT",
    auth,
    requestData,
  );

  return {
    success: true,
    data: {
      post: {
        id: response.id,
        title: response.title.rendered,
        content: response.content.rendered,
        status: response.status,
        link: response.link,
        excerpt: response.excerpt.rendered,
        date: response.date,
        modified: response.modified,
      },
    },
    logs: [
      `Updated WordPress post: ${response.title.rendered}`,
      `Post ID: ${response.id}`,
      `Status: ${response.status}`,
    ],
  };
}

async function getPosts(
  baseUrl: string,
  auth: { username: string; applicationPassword: string },
  queryParams?: any,
): Promise<NodeExecutionResult> {
  const params = new URLSearchParams();

  if (queryParams) {
    if (queryParams.per_page)
      params.append("per_page", queryParams.per_page.toString());
    if (queryParams.page) params.append("page", queryParams.page.toString());
    if (queryParams.status) params.append("status", queryParams.status);
    if (queryParams.search) params.append("search", queryParams.search);
  }

  const queryString = params.toString();
  const endpoint = `/wp-json/wp/v2/posts${queryString ? `?${queryString}` : ""}`;

  const response = await makeWordPressRequest(baseUrl, endpoint, "GET", auth);
  const posts = Array.isArray(response) ? response : [response];

  return {
    success: true,
    data: {
      posts: posts.map((post: any) => ({
        id: post.id,
        title: post.title.rendered,
        excerpt: post.excerpt.rendered,
        link: post.link,
        status: post.status,
        date: post.date,
      })),
    },
    logs: [
      `Retrieved ${posts.length} WordPress posts`,
      queryParams?.search ? `Search query: ${queryParams.search}` : "",
    ].filter(Boolean),
  };
}

async function deletePost(
  baseUrl: string,
  auth: { username: string; applicationPassword: string },
  postId: number,
): Promise<NodeExecutionResult> {
  const response = await makeWordPressRequest(
    baseUrl,
    `/wp-json/wp/v2/posts/${postId}?force=true`,
    "DELETE",
    auth,
  );

  return {
    success: true,
    data: {
      post: {
        id: response.previous.id,
        title: response.previous.title.rendered,
        content: response.previous.content.rendered,
        status: "deleted",
        link: response.previous.link,
        excerpt: response.previous.excerpt.rendered,
        date: response.previous.date,
        modified: response.previous.modified,
      },
    },
    logs: [
      `Deleted WordPress post: ${response.previous.title.rendered}`,
      `Post ID: ${response.previous.id}`,
    ],
  };
}

// ==================== NODE DEFINITION ====================

export const WordPressNodeDefinition: IntegrationNodeDefinition = {
  metadata: {
    id: "external.wordpress",
    name: "WordPress",
    description:
      "Interact with WordPress sites via REST API - create, update, read, and delete posts",
    type: "external",
    category: "cms",
    version: "2.0.0",
    icon: "FileText",
    color: "#21759B",
  },

  configSchema: {
    input: z.object({
      postData: z
        .object({
          title: z.string().min(1, "Title is required"),
          content: z.string().optional(),
          status: z.enum(["publish", "draft", "private"]).default("draft"),
          excerpt: z.string().optional(),
          categories: z.array(z.string()).optional(),
          tags: z.array(z.string()).optional(),
          featured_media: z.number().optional(),
          slug: z.string().optional(),
        })
        .optional(),
      postId: z.number().optional(),
      query: z
        .object({
          per_page: z.number().max(100).default(10),
          page: z.number().default(1),
          status: z
            .enum(["publish", "draft", "private", "any"])
            .default("publish"),
          search: z.string().optional(),
        })
        .optional(),
      action: z.enum([
        "create_post",
        "update_post",
        "get_posts",
        "delete_post",
      ]),
    }),
    output: z.object({
      success: z.boolean(),
      data: z
        .object({
          post: z
            .object({
              id: z.number(),
              title: z.string(),
              content: z.string(),
              status: z.string(),
              link: z.string().url(),
              excerpt: z.string(),
              date: z.string(),
              modified: z.string(),
            })
            .optional(),
          posts: z
            .array(
              z.object({
                id: z.number(),
                title: z.string(),
                excerpt: z.string(),
                link: z.string().url(),
                status: z.string(),
                date: z.string(),
              }),
            )
            .optional(),
        })
        .optional(),
      error: z.string().optional(),
    }),
    settings: z.object({
      defaultStatus: z.enum(["publish", "draft", "private"]).default("draft"),
      defaultCategories: z.array(z.string()).default([]),
      defaultTags: z.array(z.string()).default([]),
    }),
  },

  connections: [WordPressConnectionDefinition],

  execute: async (
    context: NodeExecutionContext,
  ): Promise<NodeExecutionResult> => {
    try {
      const input = WordPressInputSchema.parse(context.inputData);
      const connection = WordPressConnectionDefinition.authSchema.parse(
        context.connections.wordpress,
      );

      const { action, postData, postId, query } = input;
      const auth = {
        username: connection.username,
        applicationPassword: connection.applicationPassword,
      };

      switch (action) {
        case "create_post":
          if (!postData) {
            throw new Error("Post data is required for creating a post");
          }
          return await createPost(connection.baseUrl, auth, postData);

        case "update_post":
          if (!postId || !postData) {
            throw new Error(
              "Post ID and post data are required for updating a post",
            );
          }
          return await updatePost(connection.baseUrl, auth, postId, postData);

        case "get_posts":
          return await getPosts(connection.baseUrl, auth, query);

        case "delete_post":
          if (!postId) {
            throw new Error("Post ID is required for deleting a post");
          }
          return await deletePost(connection.baseUrl, auth, postId);

        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        logs: [
          `WordPress operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      };
    }
  },

  async validate(settings: unknown): Promise<boolean> {
    try {
      WordPressInputSchema.parse(settings);
      return true;
    } catch {
      return false;
    }
  },
};
