/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";

/**
 * Integration Manifest Types and Validation Schemas
 *
 * This module defines the structure for integration manifests that can be
 * discovered and loaded from the file system. Manifests provide a declarative
 * way to define integration nodes without writing code.
 */

// Core manifest metadata schema
export const ManifestMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  type: z.union([z.literal("external"), z.literal("system")]),
  category: z.string(),
  icon: z.optional(z.string()),
  color: z.optional(z.string()),
  author: z.optional(z.string()),
  homepage: z.optional(z.string()),
  repository: z.optional(z.string()),
  license: z.optional(z.string()),
  keywords: z.optional(z.array(z.string())),
  tags: z.optional(z.array(z.string())),
});

// Schema definition for input/output/settings
export const SchemaDefinitionSchema = z.object({
  description: z.optional(z.string()),
  required: z.optional(z.boolean()),
  schema: z.string(), // JSON stringified Zod schema
  examples: z.optional(z.array(z.any())),
});

// Configuration field definition for dynamic forms
export const ConfigFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.union([
    z.literal("text"),
    z.literal("textarea"),
    z.literal("number"),
    z.literal("boolean"),
    z.literal("select"),
    z.literal("password"),
    z.literal("email"),
    z.literal("url"),
  ]),
  description: z.optional(z.string()),
  required: z.optional(z.boolean()),
  defaultValue: z.optional(z.any()),
  options: z.optional(
    z.array(
      z.object({
        value: z.string(),
        label: z.string(),
      }),
    ),
  ),
  validation: z.optional(z.string()), // JSON stringified Zod schema
});

// Authentication configuration schema
export const AuthConfigSchema = z.object({
  type: z.union([
    z.literal("none"),
    z.literal("api_key"),
    z.literal("oauth2"),
    z.literal("basic_auth"),
    z.literal("bearer_token"),
    z.literal("custom"),
  ]),
  fields: z.array(ConfigFieldSchema),
  testEndpoint: z.optional(z.string()),
  scopes: z.optional(z.array(z.string())),
  authUrl: z.optional(z.string()),
  tokenUrl: z.optional(z.string()),
  clientId: z.optional(z.string()),
  clientSecret: z.optional(z.string()),
});

// Connection definition schema
export const ConnectionDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.union([
    z.literal("oauth2"),
    z.literal("api_key"),
    z.literal("basic_auth"),
    z.literal("custom"),
  ]),
  authSchema: z.string(), // JSON stringified Zod schema
  testEndpoint: z.optional(z.string()),
  description: z.optional(z.string()),
});

// Action definition schema for external integrations
export const ActionDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.optional(z.string()),
  configSchema: z.object({
    input: SchemaDefinitionSchema,
    output: SchemaDefinitionSchema,
    settings: SchemaDefinitionSchema,
  }),
  configFields: z.optional(z.array(ConfigFieldSchema)),
  endpoint: z.optional(z.string()),
  method: z.optional(
    z.union([
      z.literal("GET"),
      z.literal("POST"),
      z.literal("PUT"),
      z.literal("PATCH"),
      z.literal("DELETE"),
    ]),
  ),
  headers: z.optional(z.record(z.string())),
  bodyTemplate: z.optional(z.string()),
  responseMapping: z.optional(z.record(z.string())),
  errorMapping: z.optional(z.record(z.string())),
});

// Trigger definition schema
export const TriggerDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.optional(z.string()),
  type: z.union([
    z.literal("webhook"),
    z.literal("polling"),
    z.literal("schedule"),
  ]),
  configSchema: z.object({
    input: SchemaDefinitionSchema,
    output: SchemaDefinitionSchema,
    settings: SchemaDefinitionSchema,
  }),
  configFields: z.optional(z.array(ConfigFieldSchema)),
  webhookPath: z.optional(z.string()),
  pollingInterval: z.optional(z.number()),
  scheduleExpression: z.optional(z.string()),
  endpoint: z.optional(z.string()),
  method: z.optional(z.string()),
});

// Main integration manifest schema
export const IntegrationManifestSchema = z.object({
  $schema: z.optional(z.string()),
  metadata: ManifestMetadataSchema,
  auth: z.optional(AuthConfigSchema),
  connections: z.optional(z.array(ConnectionDefinitionSchema)),
  actions: z.optional(z.array(ActionDefinitionSchema)),
  triggers: z.optional(z.array(TriggerDefinitionSchema)),
  dependencies: z.optional(z.record(z.string())),
  scripts: z.optional(
    z.object({
      install: z.optional(z.string()),
      uninstall: z.optional(z.string()),
      test: z.optional(z.string()),
    }),
  ),
  resources: z.optional(
    z.object({
      documentation: z.optional(z.string()),
      examples: z.optional(z.array(z.string())),
      schemas: z.optional(z.array(z.string())),
    }),
  ),
});

// TypeScript interfaces derived from Zod schemas
export type ManifestMetadata = z.infer<typeof ManifestMetadataSchema>;
export type SchemaDefinition = z.infer<typeof SchemaDefinitionSchema>;
export type ConfigField = z.infer<typeof ConfigFieldSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type ConnectionDefinition = z.infer<typeof ConnectionDefinitionSchema>;
export type ActionDefinition = z.infer<typeof ActionDefinitionSchema>;
export type TriggerDefinition = z.infer<typeof TriggerDefinitionSchema>;
export type IntegrationManifest = z.infer<typeof IntegrationManifestSchema>;

// Validation function
export function validateManifest(
  manifest: any,
): manifest is IntegrationManifest {
  try {
    IntegrationManifestSchema.parse(manifest);
    return true;
  } catch (error) {
    console.error("Manifest validation failed:", error);
    return false;
  }
}

// Validation with detailed error reporting
export function validateManifestWithErrors(manifest: any): {
  valid: boolean;
  errors: string[];
  manifest?: IntegrationManifest;
} {
  try {
    const validatedManifest = IntegrationManifestSchema.parse(manifest);
    return {
      valid: true,
      errors: [],
      manifest: validatedManifest,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        ),
      };
    }
    return {
      valid: false,
      errors: [
        `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}

// Helper function to convert manifest to integration node seed format
export function manifestToSeed(manifest: IntegrationManifest): {
  integrationNodes: any[];
  connections: any[];
} {
  const integrationNodes: any[] = [];
  const connections: any[] = [];

  // Process actions as integration nodes
  if (manifest.actions) {
    for (const action of manifest.actions) {
      integrationNodes.push({
        identifier: `${manifest.metadata.type}.${manifest.metadata.id}.${action.id}`,
        name: `${manifest.metadata.name} - ${action.name}`,
        category: "action",
        integrationType: manifest.metadata.id,
        description: action.description,
        inputSchema: action.configSchema.input.schema,
        outputSchema: action.configSchema.output.schema,
        configSchema: action.configSchema.settings.schema,
        uiConfig: JSON.stringify(action.configFields ?? []),
        version: manifest.metadata.version,
        deprecated: false,
        tags: manifest.metadata.tags ?? [],
        manifestData: JSON.stringify({
          endpoint: action.endpoint,
          method: action.method,
          headers: action.headers,
          bodyTemplate: action.bodyTemplate,
          responseMapping: action.responseMapping,
          errorMapping: action.errorMapping,
        }),
      });
    }
  }

  // Process triggers as integration nodes
  if (manifest.triggers) {
    for (const trigger of manifest.triggers) {
      integrationNodes.push({
        identifier: `${manifest.metadata.type}.${manifest.metadata.id}.${trigger.id}`,
        name: `${manifest.metadata.name} - ${trigger.name}`,
        category: "trigger",
        integrationType: manifest.metadata.id,
        description: trigger.description,
        inputSchema: trigger.configSchema.input.schema,
        outputSchema: trigger.configSchema.output.schema,
        configSchema: trigger.configSchema.settings.schema,
        uiConfig: JSON.stringify(trigger.configFields ?? []),
        version: manifest.metadata.version,
        deprecated: false,
        tags: manifest.metadata.tags ?? [],
        manifestData: JSON.stringify({
          type: trigger.type,
          webhookPath: trigger.webhookPath,
          pollingInterval: trigger.pollingInterval,
          scheduleExpression: trigger.scheduleExpression,
          endpoint: trigger.endpoint,
          method: trigger.method,
        }),
      });
    }
  }

  // Process connections
  if (manifest.connections) {
    for (const connection of manifest.connections) {
      connections.push({
        id: connection.id,
        name: connection.name,
        type: connection.type,
        authSchema: connection.authSchema,
        testEndpoint: connection.testEndpoint,
        description: connection.description,
        integrationType: manifest.metadata.id,
      });
    }
  }

  return { integrationNodes, connections };
}
