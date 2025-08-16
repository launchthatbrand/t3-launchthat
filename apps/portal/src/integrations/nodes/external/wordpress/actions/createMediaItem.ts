import { z } from "zod";

import type {
  ActionDefinition,
  ActionExecutionContext,
  ActionExecutionResult,
} from "@acme/integration-sdk";

// WordPress media schema
const WordPressMediaSchema = z.object({
  id: z.number(),
  date: z.string(),
  date_gmt: z.string(),
  guid: z.object({
    rendered: z.string(),
  }),
  modified: z.string(),
  modified_gmt: z.string(),
  slug: z.string(),
  status: z.string(),
  type: z.string(),
  link: z.string(),
  title: z.object({
    rendered: z.string(),
  }),
  author: z.number(),
  comment_status: z.string(),
  ping_status: z.string(),
  template: z.string(),
  meta: z.array(z.unknown()),
  description: z.object({
    rendered: z.string(),
  }),
  caption: z.object({
    rendered: z.string(),
  }),
  alt_text: z.string(),
  media_type: z.string(),
  mime_type: z.string(),
  media_details: z.object({
    width: z.number(),
    height: z.number(),
    file: z.string(),
    sizes: z.record(z.unknown()),
  }),
  post: z.number(),
  source_url: z.string(),
});

// WordPress connection auth schema for requests
const WordPressAuthSchema = z.object({
  baseUrl: z.string(),
  username: z.string(),
  password: z.string(),
});

// Input schema for creating a media item
const CreateMediaItemInputSchema = z.object({
  file: z.string().min(1, "File URL or base64 data is required"),
  title: z.string().optional(),
  caption: z.string().optional(),
  alt_text: z.string().optional(),
  description: z.string().optional(),
  post: z.number().optional(), // ID of the post to attach media to
});

// Output schema for create media item action
const CreateMediaItemOutputSchema = z.object({
  success: z.boolean(),
  data: WordPressMediaSchema.optional(),
  error: z.string().optional(),
});

// Helper function to make WordPress API requests for media
async function makeWordPressMediaRequest(
  endpoint: string,
  method: string,
  auth: z.infer<typeof WordPressAuthSchema>,
  data?: unknown,
): Promise<z.infer<typeof WordPressMediaSchema>> {
  const { baseUrl, username, password } = auth;
  const url = `${baseUrl}/wp-json/wp/v2${endpoint}`;

  const headers: HeadersInit = {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    // For media uploads, we need to handle FormData
    if (data instanceof FormData) {
      options.body = data;
      // Don't set Content-Type for FormData - browser will set it with boundary
    } else {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(data);
    }
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `WordPress API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

// Create Media Item Action Definition
export const createMediaItem: ActionDefinition = {
  id: "create_media_item",
  name: "Create Media Item",
  description: "Upload a new media file to WordPress",

  inputSchema: CreateMediaItemInputSchema,
  outputSchema: CreateMediaItemOutputSchema,

  async execute(
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    try {
      const input = CreateMediaItemInputSchema.parse(context.inputData);
      const auth = WordPressAuthSchema.parse(context.connections?.wordpress);

      // Create FormData for file upload
      const formData = new FormData();

      // Handle file input - could be URL or base64 data
      if (input.file.startsWith("data:")) {
        // Base64 data
        const response = await fetch(input.file);
        const blob = await response.blob();
        formData.append("file", blob, "uploaded-file");
      } else if (input.file.startsWith("http")) {
        // URL - fetch and convert to blob
        const response = await fetch(input.file);
        const blob = await response.blob();
        formData.append("file", blob, "uploaded-file");
      } else {
        throw new Error("Invalid file input. Must be a URL or base64 data.");
      }

      // Add other fields
      if (input.title) formData.append("title", input.title);
      if (input.caption) formData.append("caption", input.caption);
      if (input.alt_text) formData.append("alt_text", input.alt_text);
      if (input.description) formData.append("description", input.description);
      if (input.post) formData.append("post", input.post.toString());

      const result = await makeWordPressMediaRequest(
        "/media",
        "POST",
        auth,
        formData,
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
            : "Unknown error creating media item",
      };
    }
  },

  // UI configuration for this specific action
  ui: {
    category: "media",
    featured: false,
    examples: [
      {
        name: "Upload Image",
        description: "Upload an image file to WordPress",
        input: {
          file: "https://example.com/image.jpg",
          title: "My Uploaded Image",
          alt_text: "Alternative text for accessibility",
        },
      },
      {
        name: "Upload Document",
        description: "Upload a PDF or document file",
        input: {
          file: "data:application/pdf;base64,JVBERi0xLjQK...",
          title: "Important Document",
          description: "This is an important document for reference",
        },
      },
    ],
    documentation: {
      description:
        "Upload media files (images, documents, videos) to WordPress.",
      usage:
        "Provide a file URL or base64 data. Optionally add title, caption, alt text, and description.",
      notes: [
        "Supported file types: images (JPG, PNG, GIF), documents (PDF, DOC), videos (MP4, MOV)",
        "File size limit depends on your WordPress configuration",
        "Use alt_text for accessibility compliance",
        "Attach to a specific post using the post ID field",
      ],
    },
  },
};
