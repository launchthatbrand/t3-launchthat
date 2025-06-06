/**
 * Transformations Module
 *
 * This file is the main entry point for the transformations system,
 * which provides functionality for mapping and transforming data
 * between different schemas and formats.
 */

import { v } from "convex/values";

import { action, mutation, query } from "../../_generated/server";
import { executeTransformation } from "./core";
import { registerNumberTransformations } from "./functions/number";
import { registerStringTransformations } from "./functions/string";
import {
  findCompatibleTransformations,
  getAllTransformationFunctions,
} from "./registry";
import { seedTransformationData } from "./seed";
import { DataType } from "./types";

// Initialize all transformation functions
function initializeTransformationFunctions() {
  // Register string transformations
  registerStringTransformations();

  // Register number transformations
  registerNumberTransformations();

  // More transformation categories can be registered here as they are implemented
}

// Initialize on module load
initializeTransformationFunctions();

/**
 * Initialize the transformation system
 * This function should be called during system setup to ensure the transformation
 * system is properly initialized with sample data and functions.
 */
export const initialize = mutation({
  args: {
    seedSampleData: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Initialize transformation functions
    initializeTransformationFunctions();

    // Seed sample data if requested
    if (args.seedSampleData) {
      await seedTransformationData(ctx.db);
    }

    return "Transformation system initialized successfully";
  },
});

/**
 * Get all available transformation functions
 */
export const getTransformationFunctions = query({
  args: {},
  returns: v.any(),
  handler: async () => {
    return getAllTransformationFunctions();
  },
});

/**
 * Find compatible transformation functions for a source and target data type
 */
export const getCompatibleTransformations = query({
  args: {
    sourceType: v.string(),
    targetType: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (_, args) => {
    const sourceType = args.sourceType as DataType;
    const targetType = args.targetType as DataType | undefined;

    return findCompatibleTransformations(sourceType, targetType);
  },
});

/**
 * Execute a data transformation
 */
export const transform = action({
  args: {
    sourceData: v.any(),
    mapping: v.object({
      id: v.string(),
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      sourceSchema: v.string(),
      targetSchema: v.string(),
      mappings: v.array(
        v.object({
          sourceField: v.string(),
          targetField: v.string(),
          transformation: v.optional(
            v.object({
              functionId: v.string(),
              parameters: v.record(v.string(), v.any()),
            }),
          ),
        }),
      ),
      customJsTransform: v.optional(v.string()),
    }),
    targetData: v.optional(v.any()),
  },
  returns: v.any(),
  handler: async (_, args) => {
    const targetData = args.targetData ?? {};

    const result = await executeTransformation({
      sourceData: args.sourceData,
      targetData,
      mapping: args.mapping,
      logger: (message, level) => {
        console.log(`[${level ?? "info"}] ${message}`);
      },
    });

    return result;
  },
});

/**
 * Save a mapping configuration
 */
export const saveMappingConfiguration = mutation({
  args: {
    mapping: v.object({
      id: v.string(),
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      sourceSchema: v.string(),
      targetSchema: v.string(),
      mappings: v.array(
        v.object({
          sourceField: v.string(),
          targetField: v.string(),
          transformation: v.optional(
            v.object({
              functionId: v.string(),
              parameters: v.record(v.string(), v.any()),
            }),
          ),
        }),
      ),
      customJsTransform: v.optional(v.string()),
    }),
    overwrite: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Check if mapping with this ID already exists
    const existing = await ctx.db
      .query("mapping_configurations")
      .filter((q) => q.eq(q.field("id"), args.mapping.id))
      .first();

    if (existing && !args.overwrite) {
      throw new Error(
        `Mapping configuration with ID ${args.mapping.id} already exists`,
      );
    }

    // Add timestamps
    const mappingData = {
      ...args.mapping,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, mappingData);
      return existing._id;
    } else {
      const id = await ctx.db.insert("mapping_configurations", mappingData);
      return id;
    }
  },
});

/**
 * Delete a mapping configuration
 */
export const deleteMappingConfiguration = mutation({
  args: {
    id: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("mapping_configurations")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (!mapping) {
      throw new Error(`Mapping configuration with ID ${args.id} not found`);
    }

    await ctx.db.delete(mapping._id);
    return true;
  },
});

/**
 * Get a mapping configuration by ID
 */
export const getMappingConfiguration = query({
  args: {
    id: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("mapping_configurations")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (!mapping) {
      throw new Error(`Mapping configuration with ID ${args.id} not found`);
    }

    return mapping;
  },
});

/**
 * List all mapping configurations
 */
export const listMappingConfigurations = query({
  args: {
    sourceSchema: v.optional(v.string()),
    targetSchema: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let query = ctx.db.query("mapping_configurations");

    if (args.sourceSchema) {
      query = query.filter((q) =>
        q.eq(q.field("sourceSchema"), args.sourceSchema!),
      );
    }

    if (args.targetSchema) {
      query = query.filter((q) =>
        q.eq(q.field("targetSchema"), args.targetSchema!),
      );
    }

    return await query.collect();
  },
});

/**
 * Save a data schema
 */
export const saveDataSchema = mutation({
  args: {
    schema: v.object({
      id: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      fields: v.array(v.any()),
    }),
    overwrite: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Check if schema with this ID already exists
    const existing = await ctx.db
      .query("data_schemas")
      .filter((q) => q.eq(q.field("id"), args.schema.id))
      .first();

    if (existing && !args.overwrite) {
      throw new Error(`Data schema with ID ${args.schema.id} already exists`);
    }

    // Add timestamps
    const schemaData = {
      ...args.schema,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, schemaData);
      return existing._id;
    } else {
      const id = await ctx.db.insert("data_schemas", schemaData);
      return id;
    }
  },
});

/**
 * Get a data schema by ID
 */
export const getDataSchema = query({
  args: {
    id: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const schema = await ctx.db
      .query("data_schemas")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (!schema) {
      throw new Error(`Data schema with ID ${args.id} not found`);
    }

    return schema;
  },
});

/**
 * List all data schemas
 */
export const listDataSchemas = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db.query("data_schemas").collect();
  },
});
