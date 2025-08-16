import type { ActionCtx } from "../../_generated/server";
import type { z } from "zod";

export type ActionResult<T> =
  | { kind: "success"; data: T }
  | { kind: "retryable_error"; error: { code: string; message: string } }
  | { kind: "fatal_error"; error: { code: string; message: string } };

export interface ActionContext extends ActionCtx {
  correlationId: string;
  dryRun?: boolean; // Optional flag for dry-run mode
}

export interface TriggerContext {
  correlationId: string;
}

export interface NodeContext {
  correlationId: string;
}

export interface NodeIO {
  correlationId: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ActionDefinition<TConfig, TInput, TOutput> {
  type: string;
  metadata: {
    name: string;
    description: string;
    category?: string;
  };
  configSchema: z.ZodType<TConfig>;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  execute: (
    ctx: ActionContext,
    input: TInput,
    config: TConfig,
  ) => Promise<ActionResult<TOutput>>;
}

export interface TriggerDefinition<TConfig, TPayload> {
  key: string;
  metadata: {
    name: string;
    description: string;
    category?: string;
  };
  configSchema: z.ZodType<TConfig>;
  fire: (
    ctx: TriggerContext,
    payload: TPayload,
    config: TConfig,
  ) => Promise<TriggerResult>;
}

export interface TriggerResult {
  correlationId: string;
  idempotencyKey?: string;
  payload: Record<string, unknown>;
}

export interface NodeDefinition<TConfig> {
  type: string;
  metadata: {
    name: string;
    description: string;
    category?: string;
  };
  configSchema: z.ZodType<TConfig>;
  execute: (
    ctx: NodeContext,
    input: NodeIO,
    config: TConfig,
  ) => Promise<NodeIO>;
  migrate?: (oldConfig: unknown) => TConfig;
}

function makeRegistry<T>(name: string) {
  const map = new Map<string, T>();
  return {
    register(key: string, def: T) {
      if (map.has(key)) {
        throw new Error(`${name} '${key}' is already registered`);
      }
      map.set(key, def);
      return def;
    },
    get(key: string) {
      const def = map.get(key);
      if (!def) throw new Error(`${name} '${key}' not found in registry`);
      return def;
    },
    getAll() {
      return Array.from(map.values());
    },
  } as const;
}

export const actionRegistry =
  makeRegistry<ActionDefinition<unknown, unknown, unknown>>("Action type");
export const triggerRegistry =
  makeRegistry<TriggerDefinition<unknown, unknown>>("Trigger key");
export const nodeRegistry = makeRegistry<NodeDefinition<unknown>>("Node type");

export function validateWithSchema<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join("; ");
    throw new Error(`Validation failed: ${message}`);
  }
  return parsed.data;
}
