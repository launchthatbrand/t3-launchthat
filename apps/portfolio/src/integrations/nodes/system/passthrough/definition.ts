import { z } from "zod";

import type { IntegrationNodeDefinition } from "@acme/integration-sdk";

const passthroughSettingsSchema = z.object({
  mode: z.enum(["passthrough", "delay"]).default("passthrough"),
  delayMs: z.number().min(0).max(10000).optional(),
});

export const passthroughNodeDefinition: IntegrationNodeDefinition = {
  metadata: {
    id: "system.passthrough",
    name: "Passthrough",
    description: "Control data flow with delay capabilities",
    type: "system",
    category: "data",
    version: "1.0.0",
    icon: "ArrowRight",
    color: "#6366F1",
  },

  configSchema: {
    input: {
      schema: z.any(),
      description: "Any data to process",
    },
    output: {
      schema: z.object({
        success: z.boolean(),
        data: z.any(),
      }),
      description: "Processed data",
    },
    settings: {
      schema: passthroughSettingsSchema,
      description: "Passthrough configuration",
    },
  },

  processor: {
    async execute(context) {
      const { settings, inputData } = context;
      const passthroughSettings = settings as z.infer<
        typeof passthroughSettingsSchema
      >;

      if (passthroughSettings.delayMs && passthroughSettings.delayMs > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, passthroughSettings.delayMs),
        );
      }

      return {
        success: true,
        data: {
          success: true,
          data: inputData,
        },
        logs: ["Data passed through successfully"],
      };
    },

    async validate(settings) {
      try {
        passthroughSettingsSchema.parse(settings);
        return true;
      } catch {
        return false;
      }
    },
  },
};
