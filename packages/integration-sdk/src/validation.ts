import { z } from "zod";

import type {
  DynamicFormSchema,
  FormFieldDefinition,
  NodeConfigSchema,
} from "./types.js";

// Zod schema builders for dynamic form generation
export function createFormFieldSchema(
  field: FormFieldDefinition,
): z.ZodSchema<any> {
  let schema: z.ZodSchema<any>;

  switch (field.type) {
    case "text":
    case "textarea":
    case "password":
      schema = z.string();
      break;
    case "number":
      schema = z.number();
      break;
    case "boolean":
      schema = z.boolean();
      break;
    case "select":
      if (field.options && field.options.length > 0) {
        const values = field.options.map((opt) => opt.value);
        schema = z.enum(values as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;
    default:
      schema = z.string();
  }

  // Apply additional validation if provided
  if (field.validation) {
    schema = field.validation;
  }

  // Make optional if not required
  if (!field.required) {
    schema = schema.optional();
  }

  return schema;
}

export function createDynamicFormSchema(
  formSchema: DynamicFormSchema,
): z.ZodSchema<any> {
  const schemaFields: Record<string, z.ZodSchema<any>> = {};

  for (const field of formSchema.fields) {
    schemaFields[field.name] = createFormFieldSchema(field);
  }

  return z.object(schemaFields);
}

// Standard validation schemas for common node types
export const commonValidationSchemas = {
  webhook: {
    settings: z.object({
      url: z.string().url("Must be a valid URL"),
      method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
      headers: z.record(z.string(), z.string()).optional(),
      timeout: z.number().min(1000).max(30000).optional(),
      retries: z.number().min(0).max(5).optional(),
    }),
    input: z.object({
      payload: z.unknown().optional(),
      headers: z.record(z.string(), z.string()).optional(),
    }),
    output: z.object({
      statusCode: z.number(),
      body: z.unknown(),
      headers: z.record(z.string(), z.string()),
    }),
  },

  email: {
    settings: z.object({
      to: z.string().email("Must be a valid email"),
      subject: z.string().min(1, "Subject is required"),
      template: z.string().optional(),
      attachments: z.array(z.string()).optional(),
    }),
    input: z.object({
      variables: z.record(z.string(), z.unknown()).optional(),
      attachments: z
        .array(
          z.object({
            filename: z.string(),
            content: z.string(),
            contentType: z.string(),
          }),
        )
        .optional(),
    }),
    output: z.object({
      messageId: z.string(),
      status: z.enum(["sent", "failed"]),
      error: z.string().optional(),
    }),
  },

  database: {
    settings: z.object({
      operation: z.enum(["create", "read", "update", "delete"]),
      table: z.string().min(1, "Table name is required"),
      fields: z.array(z.string()).optional(),
      conditions: z.record(z.string(), z.unknown()).optional(),
    }),
    input: z.object({
      data: z.record(z.string(), z.unknown()).optional(),
      filters: z.record(z.string(), z.unknown()).optional(),
    }),
    output: z.object({
      success: z.boolean(),
      data: z.unknown().optional(),
      affectedRows: z.number().optional(),
    }),
  },

  transform: {
    settings: z.object({
      transformType: z.enum(["map", "filter", "reduce", "sort", "format"]),
      expression: z.string().min(1, "Transform expression is required"),
      outputFormat: z.enum(["json", "csv", "xml", "text"]).optional(),
    }),
    input: z.object({
      data: z.unknown(),
    }),
    output: z.object({
      transformedData: z.unknown(),
      metadata: z
        .object({
          inputCount: z.number(),
          outputCount: z.number(),
          transformationType: z.string(),
        })
        .optional(),
    }),
  },
};

// Validation helper functions
export function validateNodeConfig(
  config: unknown,
  schema: NodeConfigSchema,
): { success: boolean; errors?: string[] } {
  try {
    schema.settings.parse(config);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`,
        ),
      };
    }
    return {
      success: false,
      errors: ["Unknown validation error"],
    };
  }
}

export function validateInput(
  input: unknown,
  schema: z.ZodSchema<any>,
): { success: boolean; data?: unknown; errors?: string[] } {
  try {
    const data = schema.parse(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`,
        ),
      };
    }
    return {
      success: false,
      errors: ["Unknown validation error"],
    };
  }
}

// Form field generators for common patterns
export function createTextField(
  name: string,
  label: string,
  options: Partial<FormFieldDefinition> = {},
): FormFieldDefinition {
  return {
    name,
    label,
    type: "text",
    required: false,
    ...options,
  };
}

export function createSelectField(
  name: string,
  label: string,
  options: Array<{ value: string; label: string }>,
  fieldOptions: Partial<FormFieldDefinition> = {},
): FormFieldDefinition {
  return {
    name,
    label,
    type: "select",
    options,
    required: false,
    ...fieldOptions,
  };
}

export function createNumberField(
  name: string,
  label: string,
  options: Partial<FormFieldDefinition> = {},
): FormFieldDefinition {
  return {
    name,
    label,
    type: "number",
    required: false,
    ...options,
  };
}

export function createBooleanField(
  name: string,
  label: string,
  options: Partial<FormFieldDefinition> = {},
): FormFieldDefinition {
  return {
    name,
    label,
    type: "boolean",
    required: false,
    ...options,
  };
}
