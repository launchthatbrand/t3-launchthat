import { z } from "zod";

import type {
  ActionDefinition,
  ActionExecutionContext,
  ActionExecutionResult,
} from "@acme/integration-sdk";

// WordPress post status options
const PostStatusSchema = z.enum([
  "publish",
  "draft",
  "private",
  "future",
  "trash",
]);

// WordPress post schema
const WordPressPostSchema = z.object({
  id: z.number(),
  title: z.object({
    rendered: z.string(),
  }),
  content: z.object({
    rendered: z.string(),
  }),
  status: PostStatusSchema,
  date: z.string(),
  modified: z.string(),
  slug: z.string(),
  link: z.string(),
  excerpt: z.object({
    rendered: z.string(),
  }),
  author: z.number(),
  featured_media: z.number(),
  comment_status: z.string(),
  ping_status: z.string(),
  sticky: z.boolean(),
  template: z.string(),
  format: z.string(),
  categories: z.array(z.number()),
  tags: z.array(z.number()),
});

// WordPress connection auth schema for requests
const WordPressAuthSchema = z.object({
  baseUrl: z.string(),
  username: z.string(),
  password: z.string(),
});

// Input schema for creating a post
const CreatePostInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().default(""),
  status: PostStatusSchema.default("draft"),
  excerpt: z.string().optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  featured_media: z.number().optional(),
  slug: z.string().optional(),
});

// Output schema for create post action
const CreatePostOutputSchema = z.object({
  success: z.boolean(),
  data: WordPressPostSchema.optional(),
  error: z.string().optional(),
});

// Helper function to make WordPress API requests
async function makeWordPressRequest(
  endpoint: string,
  method: string,
  auth: z.infer<typeof WordPressAuthSchema>,
  data?: unknown,
): Promise<z.infer<typeof WordPressPostSchema>> {
  const { baseUrl, username, password } = auth;
  const url = `${baseUrl}/wp-json/wp/v2${endpoint}`;

  const headers: HeadersInit = {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `WordPress API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

// Create Post Action Definition
export const createPost: ActionDefinition = {
  id: "create_post",
  name: "Create Post",
  description: "Create a new WordPress post",

  inputSchema: CreatePostInputSchema,
  outputSchema: CreatePostOutputSchema,

  async execute(
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    try {
      const input = CreatePostInputSchema.parse(context.inputData);
      const auth = WordPressAuthSchema.parse(context.connections?.wordpress);

      const postData = {
        title: input.title,
        content: input.content,
        status: input.status,
        excerpt: input.excerpt,
        categories: input.categories,
        tags: input.tags,
        featured_media: input.featured_media,
        slug: input.slug,
      };

      const result = await makeWordPressRequest(
        "/posts",
        "POST",
        auth,
        postData,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error creating post",
      };
    }
  },

  // UI configuration for this specific action
  ui: {
    category: "content",
    featured: true,
    examples: [
      {
        name: "Simple Blog Post",
        description: "Create a basic blog post with title and content",
        input: {
          title: "My First Blog Post",
          content: "This is the content of my first blog post.",
          status: "draft",
        },
      },
      {
        name: "Published Article",
        description: "Create and publish an article immediately",
        input: {
          title: "Breaking News Article",
          content:
            "This is breaking news content that needs to be published immediately.",
          status: "publish",
          excerpt: "A brief summary of the breaking news.",
        },
      },
    ],
    documentation: {
      description:
        "Create new WordPress posts with customizable content, status, and metadata.",
      usage:
        "Fill in the title and content fields. Optionally set status, excerpt, categories, tags, and featured media.",
      notes: [
        "Use 'draft' status to save without publishing",
        "Categories and tags should be existing WordPress taxonomy IDs",
        "Featured media should be an existing media attachment ID",
      ],
    },
  },
};

