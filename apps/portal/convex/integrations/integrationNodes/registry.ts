import type { NodeContext, NodeDefinition, NodeIO } from "../lib/registries";
import { nodeRegistry, validateWithSchema } from "../lib/registries";

import { z } from "zod";

const PassThroughConfigSchema = z.object({
  enabled: z.boolean().optional(),
});
export type PassThroughConfig = z.infer<typeof PassThroughConfigSchema>;

// Enhanced pass-through config with additional features
const EnhancedPassThroughConfigSchema = z.object({
  enabled: z.boolean().optional(),
  delay: z.number().optional(), // New field: delay in ms
  transformData: z.boolean().optional(), // New field: whether to transform data
});
export type EnhancedPassThroughConfig = z.infer<
  typeof EnhancedPassThroughConfigSchema
>;

const passThroughNode: NodeDefinition<PassThroughConfig> = {
  type: "core.passThrough",
  metadata: {
    name: "Pass Through",
    description: "Returns input as output; useful for testing",
    category: "core",
  },
  configSchema: PassThroughConfigSchema,
  execute: (
    _ctx: NodeContext,
    input: NodeIO,
    config: PassThroughConfig,
  ): Promise<NodeIO> => {
    validateWithSchema(PassThroughConfigSchema, config);
    return Promise.resolve(input);
  },
};

const enhancedPassThroughNode: NodeDefinition<EnhancedPassThroughConfig> = {
  type: "core.enhancedPassThrough",
  metadata: {
    name: "Enhanced Pass Through",
    description:
      "Returns input as output with optional delay and data transformation",
    category: "core",
  },
  configSchema: EnhancedPassThroughConfigSchema,
  execute: async (
    _ctx: NodeContext,
    input: NodeIO,
    config: EnhancedPassThroughConfig,
  ): Promise<NodeIO> => {
    validateWithSchema(EnhancedPassThroughConfigSchema, config);

    // Apply delay if specified
    if (config.delay && config.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, config.delay));
    }

    // Transform data if requested
    if (config.transformData) {
      return {
        ...input,
        data: {
          ...input.data,
          transformed: true,
          processedAt: Date.now(),
        },
      };
    }

    return input;
  },
  // Migration function to upgrade from basic pass-through
  migrate: (oldConfig: unknown): EnhancedPassThroughConfig => {
    // Handle migration from basic pass-through config
    if (typeof oldConfig === "object" && oldConfig !== null) {
      const old = oldConfig as Record<string, unknown>;
      return {
        enabled: typeof old.enabled === "boolean" ? old.enabled : true,
        delay: 0, // Default delay
        transformData: false, // Default transform behavior
      };
    }

    // Default configuration for invalid input
    return {
      enabled: true,
      delay: 0,
      transformData: false,
    };
  },
};

export const registerPassThroughNode = nodeRegistry.register(
  passThroughNode.type,
  passThroughNode as NodeDefinition<unknown>,
);

export const registerEnhancedPassThroughNode = nodeRegistry.register(
  enhancedPassThroughNode.type,
  enhancedPassThroughNode as NodeDefinition<unknown>,
);
