import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const integrationsRouter = createTRPCRouter({
  // Existing routes...

  // Transformations
  transformations: createTRPCRouter({
    // Get all transformation functions
    getTransformationFunctions: protectedProcedure.query(async ({ ctx }) => {
      const { convex } = ctx;
      return await convex.query(
        "integrations.transformations.getTransformationFunctions",
      );
    }),

    // Get compatible transformations
    getCompatibleTransformations: protectedProcedure
      .input(
        z.object({
          sourceType: z.string(),
          targetType: z.string().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { convex } = ctx;
        return await convex.query(
          "integrations.transformations.getCompatibleTransformations",
          input,
        );
      }),

    // Execute a transformation
    transform: protectedProcedure
      .input(
        z.object({
          sourceData: z.any(),
          mapping: z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            sourceSchema: z.string(),
            targetSchema: z.string(),
            mappings: z.array(
              z.object({
                sourceField: z.string(),
                targetField: z.string(),
                transformation: z
                  .object({
                    functionId: z.string(),
                    parameters: z.record(z.any()),
                  })
                  .optional(),
              }),
            ),
            customJsTransform: z.string().optional(),
          }),
          targetData: z.any().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { convex } = ctx;
        return await convex.action(
          "integrations.transformations.transform",
          input,
        );
      }),

    // Save a mapping configuration
    saveMappingConfiguration: protectedProcedure
      .input(
        z.object({
          mapping: z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            sourceSchema: z.string(),
            targetSchema: z.string(),
            mappings: z.array(
              z.object({
                sourceField: z.string(),
                targetField: z.string(),
                transformation: z
                  .object({
                    functionId: z.string(),
                    parameters: z.record(z.any()),
                  })
                  .optional(),
              }),
            ),
            customJsTransform: z.string().optional(),
          }),
          overwrite: z.boolean().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { convex } = ctx;
        return await convex.mutation(
          "integrations.transformations.saveMappingConfiguration",
          input,
        );
      }),

    // Get a mapping configuration
    getMappingConfiguration: protectedProcedure
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { convex } = ctx;
        return await convex.query(
          "integrations.transformations.getMappingConfiguration",
          input,
        );
      }),

    // List mapping configurations
    listMappingConfigurations: protectedProcedure
      .input(
        z
          .object({
            sourceSchema: z.string().optional(),
            targetSchema: z.string().optional(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const { convex } = ctx;
        return await convex.query(
          "integrations.transformations.listMappingConfigurations",
          input || {},
        );
      }),

    // Save a data schema
    saveDataSchema: protectedProcedure
      .input(
        z.object({
          schema: z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().optional(),
            fields: z.array(z.any()),
          }),
          overwrite: z.boolean().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { convex } = ctx;
        return await convex.mutation(
          "integrations.transformations.saveDataSchema",
          input,
        );
      }),

    // Get a data schema
    getDataSchema: protectedProcedure
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { convex } = ctx;
        try {
          return await convex.query(
            "integrations.transformations.getDataSchema",
            input,
          );
        } catch (error) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Data schema with ID ${input.id} not found`,
          });
        }
      }),

    // List data schemas
    listDataSchemas: protectedProcedure
      .input(z.object({}).optional())
      .query(async ({ ctx }) => {
        const { convex } = ctx;
        return await convex.query(
          "integrations.transformations.listDataSchemas",
        );
      }),
  }),
});
