/**
 * Data transformation types
 *
 * This file defines the type system for data transformations and mappings
 * between different schemas in the integration system.
 */

import { z } from "zod";

/**
 * Basic data types supported by the transformation system
 */
export enum DataType {
  String = "string",
  Number = "number",
  Boolean = "boolean",
  Date = "date",
  Object = "object",
  Array = "array",
  Any = "any",
  Null = "null",
}

/**
 * Represents a value of any supported data type
 */
export type DataValue =
  | string
  | number
  | boolean
  | Date
  | Record<string, unknown>
  | unknown[]
  | null
  | undefined;

/**
 * Parameter definition for transformation functions
 */
export const TransformationParameterSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(DataType),
  required: z.boolean().default(true),
  description: z.string(),
  defaultValue: z.unknown().optional(),
  enum: z.array(z.unknown()).optional(),
});

export type TransformationParameter = z.infer<
  typeof TransformationParameterSchema
>;

/**
 * Transformation function category
 */
export enum TransformationCategory {
  String = "string",
  Number = "number",
  Date = "date",
  Logic = "logic",
  Array = "array",
  Object = "object",
  Conversion = "conversion",
  Advanced = "advanced",
  Json = "json",
  Custom = "custom",
}

/**
 * Schema for transformation function definition
 */
export const TransformationFunctionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.nativeEnum(TransformationCategory),
  inputTypes: z.array(z.nativeEnum(DataType)),
  outputType: z.nativeEnum(DataType),
  parameters: z.array(TransformationParameterSchema).default([]),
  examples: z
    .array(
      z.object({
        input: z.unknown(),
        params: z.record(z.string(), z.unknown()).optional(),
        output: z.unknown(),
      }),
    )
    .optional(),
});

export type TransformationFunction = z.infer<
  typeof TransformationFunctionSchema
>;

/**
 * Field mapping definition between source and target fields
 */
export const FieldMappingSchema = z.object({
  sourceField: z.string(),
  targetField: z.string(),
  transformation: z
    .object({
      functionId: z.string(),
      parameters: z.record(z.string(), z.unknown()).default({}),
    })
    .optional(),
});

export type FieldMapping = z.infer<typeof FieldMappingSchema>;

/**
 * Complete mapping configuration between data schemas
 */
export const MappingConfigurationSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  sourceSchema: z.string(), // Reference to a schema ID
  targetSchema: z.string(), // Reference to a schema ID
  mappings: z.array(FieldMappingSchema),
  customJsTransform: z.string().optional(), // Optional custom JS code
});

export type MappingConfiguration = z.infer<typeof MappingConfigurationSchema>;

/**
 * Data schema field definition
 */
export interface SchemaField {
  name: string;
  path: string;
  type: DataType;
  required: boolean;
  description?: string;
  nested?: SchemaField[];
}

const schemaFieldBase = {
  name: z.string(),
  path: z.string(),
  type: z.nativeEnum(DataType),
  required: z.boolean(),
  description: z.string().optional(),
};

export const SchemaFieldSchema: z.ZodType<SchemaField> = z.lazy(() => {
  const baseSchema = z.object(schemaFieldBase);
  return baseSchema.extend({
    nested: z
      .array(
        baseSchema.extend({
          nested: z.array(z.lazy(() => SchemaFieldSchema)).optional(),
        }),
      )
      .optional(),
  });
});

/**
 * Data schema definition
 */
export const DataSchemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  fields: z.array(SchemaFieldSchema),
});

export type DataSchema = z.infer<typeof DataSchemaSchema>;

/**
 * Runtime transformation context
 */
export interface TransformationContext {
  sourceData: Record<string, unknown>;
  targetData: Record<string, unknown>;
  mapping: MappingConfiguration;
  logger?: (message: string, level?: string) => void;
}

/**
 * Transform function execution result
 */
export interface TransformationResult {
  success: boolean;
  value?: unknown;
  error?: string;
}
