import type { z } from "zod";

export type PlatformTestCategory = "Email" | "Discord" | "Charts" | "PNG";
export type DangerLevel = "safe" | "guarded" | "dangerous";

export type TestOutput =
  | {
      kind: "image";
      contentType: string;
      /**
       * PNG bytes are returned as base64 (strings are allowed to be large in Convex values,
       * whereas arrays are capped at 8192 elements).
       */
      base64: string;
      filename?: string;
      meta?: unknown;
    }
  | { kind: "text"; text: string }
  | { kind: "json"; data: unknown }
  | { kind: "logs"; logs: string[]; data?: unknown };

export type PlatformTestDefinition<TSchema extends z.ZodTypeAny> = {
  id: string;
  category: PlatformTestCategory;
  title: string;
  description: string;
  dangerLevel: DangerLevel;
  paramSchema: TSchema;
  defaults: z.input<TSchema>;
};

