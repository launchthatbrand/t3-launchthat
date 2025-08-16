import { z } from "zod";

import { AuthFactory, ExternalNode } from "./external-node.js";
import {
  ConnectionDefinition,
  IntegrationNodeDefinition,
  NodeExecutionContext,
  NodeExecutionResult,
} from "./types.js";

/**
 * Simple External Node Template
 *
 * A minimal, working template for creating external API integrations.
 * Copy this file and customize for your specific service.
 */

// Input/Output schemas
export const SimpleInputSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export const SimpleOutputSchema = z.object({
  id: z.string(),
  status: z.string(),
});

// Connection definition
export const SimpleConnectionDefinition: ConnectionDefinition = {
  id: "simple_connection",
  name: "Simple API Connection",
  type: "api_key",
  authSchema: z.object({
    type: z.literal("api_key"),
    apiKey: z.string().min(1, "API key is required"),
  }),
};

// Node implementation
export class SimpleNode extends ExternalNode {
  constructor() {
    const authHandler = AuthFactory.createAuthHandler({
      type: "api_key",
      keyField: "apiKey",
      headerName: "Authorization",
      prefix: "Bearer ",
    });

    super("https://api.example.com", authHandler);
  }

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    try {
      const input = SimpleInputSchema.parse(context.inputData);
      const connection = SimpleConnectionDefinition.authSchema.parse(
        context.connections.simple,
      );

      // Make API call
      const response = await this.apiClient.post(
        "/send",
        {
          message: input.message,
        },
        {
          auth: connection,
        },
      );

      const output = SimpleOutputSchema.parse(response);

      return {
        success: true,
        data: output,
        logs: [`Sent message: ${input.message}`],
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }
}

// Node definition
export const SimpleNodeDefinition: IntegrationNodeDefinition = {
  metadata: {
    id: "simple_node",
    name: "Simple Node",
    description: "A simple external API node",
    type: "external",
    category: "example",
    version: "1.0.0",
  },

  configSchema: {
    input: {
      schema: SimpleInputSchema,
      description: "Input for simple node",
    },
    output: {
      schema: SimpleOutputSchema,
      description: "Output from simple node",
    },
    settings: {
      schema: z.object({}),
      description: "Settings for simple node",
    },
  },

  processor: {
    execute: async (
      context: NodeExecutionContext,
    ): Promise<NodeExecutionResult> => {
      const node = new SimpleNode();
      return node.execute(context);
    },
  },
};
