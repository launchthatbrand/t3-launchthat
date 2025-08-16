import { z } from "zod";

import type {
  TriggerContext,
  TriggerDefinition,
  TriggerResult,
} from "../lib/registries";
import { triggerRegistry, validateWithSchema } from "../lib/registries";

const OrderCreatedConfigSchema = z.object({
  enabled: z.boolean().optional(),
  source: z.string().optional(),
});

export type OrderCreatedConfig = z.infer<typeof OrderCreatedConfigSchema>;

const orderCreatedTrigger: TriggerDefinition<unknown, unknown> = {
  key: "orders.created",
  metadata: {
    name: "Order Created",
    description: "Fires when a new order is created",
    category: "orders",
  },
  configSchema: OrderCreatedConfigSchema as unknown as z.ZodType<unknown>,
  fire: (
    ctx: TriggerContext,
    payload: unknown,
    config: unknown,
  ): Promise<TriggerResult> => {
    // Validate but do not transform for now
    validateWithSchema(
      OrderCreatedConfigSchema as unknown as z.ZodType<unknown>,
      config,
    );

    return Promise.resolve({
      correlationId: ctx.correlationId,
      payload: (payload ?? {}) as Record<string, unknown>,
    });
  },
};

export const registerOrderCreatedTrigger = triggerRegistry.register(
  orderCreatedTrigger.key,
  orderCreatedTrigger,
);
