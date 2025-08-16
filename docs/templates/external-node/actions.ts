import { z } from "zod";

import type {
  ActionDefinition,
  ActionExecutionContext,
  ActionExecutionResult,
  createAction,
} from "../../../packages/integration-sdk/src/node-types.js";

/**
 * External Node Actions Template
 *
 * This file defines all actions (operations) that can be performed with this service.
 * Each action should be a separate definition with its own input/output schemas.
 */

// =====================================================
// SHARED SCHEMAS (reusable across actions)
// =====================================================

// Common success response schema
const SuccessResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

// =====================================================
// ACTION 1: Create Resource
// =====================================================

const CreateResourceInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  // Add more fields as needed for your service
});

const CreateResourceOutputSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      id: z.string(),
      name: z.string(),
      createdAt: z.string(),
      // Add more fields based on your service's response
    })
    .optional(),
  error: z.string().optional(),
});

export const CreateResourceAction: ActionDefinition = {
  id: "create_resource",
  name: "Create Resource",
  description: "Create a new resource in the service",
  inputSchema: CreateResourceInputSchema,
  outputSchema: CreateResourceOutputSchema,

  async execute(
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    try {
      // Parse and validate input
      const input = CreateResourceInputSchema.parse(context.inputData);
      const connection = context.connections.serviceName; // Use your service's connection key

      // Make API call to your service
      const response = await fetch(`${connection.baseUrl}/api/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${connection.apiKey}`, // Adjust based on your auth method
        },
        body: JSON.stringify({
          name: input.name,
          description: input.description,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          createdAt: data.created_at,
        },
        logs: [`Successfully created resource: ${data.name}`],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        logs: [`Failed to create resource: ${error}`],
      };
    }
  },

  // Optional UI configuration
  ui: {
    category: "Resources",
    featured: true,
    examples: [
      {
        name: "Create Simple Resource",
        description: "Create a basic resource with just a name",
        input: {
          name: "My New Resource",
          description: "A sample resource for testing",
        },
      },
    ],
    documentation: {
      description: "Creates a new resource in the connected service",
      usage: "Provide a name and optional description to create a new resource",
      notes: [
        "The name field is required and must not be empty",
        "Description is optional but recommended for clarity",
      ],
    },
  },
};

// =====================================================
// ACTION 2: Get Resource
// =====================================================

const GetResourceInputSchema = z.object({
  resourceId: z.string().min(1, "Resource ID is required"),
});

const GetResourceOutputSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string().optional(),
    })
    .optional(),
  error: z.string().optional(),
});

export const GetResourceAction: ActionDefinition = {
  id: "get_resource",
  name: "Get Resource",
  description: "Retrieve a specific resource by ID",
  inputSchema: GetResourceInputSchema,
  outputSchema: GetResourceOutputSchema,

  async execute(
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    try {
      const input = GetResourceInputSchema.parse(context.inputData);
      const connection = context.connections.serviceName;

      const response = await fetch(
        `${connection.baseUrl}/api/resources/${input.resourceId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${connection.apiKey}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: `Resource not found: ${input.resourceId}`,
            logs: [`Resource with ID ${input.resourceId} does not exist`],
          };
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          description: data.description,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
        logs: [`Successfully retrieved resource: ${data.name}`],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        logs: [`Failed to get resource: ${error}`],
      };
    }
  },

  ui: {
    category: "Resources",
    documentation: {
      description: "Retrieves a specific resource by its unique identifier",
      usage: "Provide the resource ID to fetch its current data",
    },
  },
};

// =====================================================
// ACTION 3: List Resources
// =====================================================

const ListResourcesInputSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  search: z.string().optional(),
});

const ListResourcesOutputSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      resources: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
          createdAt: z.string(),
        }),
      ),
      total: z.number(),
      hasMore: z.boolean(),
    })
    .optional(),
  error: z.string().optional(),
});

export const ListResourcesAction: ActionDefinition = {
  id: "list_resources",
  name: "List Resources",
  description: "Retrieve a list of resources with optional filtering",
  inputSchema: ListResourcesInputSchema,
  outputSchema: ListResourcesOutputSchema,

  async execute(
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    try {
      const input = ListResourcesInputSchema.parse(context.inputData);
      const connection = context.connections.serviceName;

      // Build query parameters
      const params = new URLSearchParams({
        limit: input.limit.toString(),
        offset: input.offset.toString(),
      });

      if (input.search) {
        params.append("search", input.search);
      }

      const response = await fetch(
        `${connection.baseUrl}/api/resources?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${connection.apiKey}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          resources: data.resources.map((resource: any) => ({
            id: resource.id,
            name: resource.name,
            description: resource.description,
            createdAt: resource.created_at,
          })),
          total: data.total,
          hasMore: data.has_more,
        },
        logs: [`Retrieved ${data.resources.length} resources`],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        logs: [`Failed to list resources: ${error}`],
      };
    }
  },

  ui: {
    category: "Resources",
    examples: [
      {
        name: "List First 10 Resources",
        description: "Get the first 10 resources",
        input: {
          limit: 10,
          offset: 0,
        },
      },
      {
        name: "Search Resources",
        description: "Search for resources containing 'test'",
        input: {
          limit: 20,
          offset: 0,
          search: "test",
        },
      },
    ],
  },
};

// =====================================================
// EXPORT ALL ACTIONS
// =====================================================

export const ServiceNameActions = {
  create_resource: CreateResourceAction,
  get_resource: GetResourceAction,
  list_resources: ListResourcesAction,
  // Add more actions as needed
};

// Default export for convenience
export default ServiceNameActions;
