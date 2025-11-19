import type { TRPCRouterRecord } from "@trpc/server";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

import { protectedProcedure } from "../trpc";

// Create zod schemas for input validation
const ContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  address: z
    .object({
      street1: z.string(),
      street2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    })
    .optional(),
  socialProfiles: z
    .object({
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      github: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

const OrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  industry: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  numberOfEmployees: z.number().optional(),
  customFields: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

const PaginationOptsSchema = z.object({
  numItems: z.number().min(1).max(100).default(10),
  cursor: z.string().nullable().optional(),
});

const ContactFilterSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  leadStatus: z.string().optional(),
  customerType: z.string().optional(),
  organizationId: z.string().optional(),
});

// Helper function to create and initialize Convex client with auth
const getConvexClient = async (token: string | null | undefined) => {
  const convex = new ConvexHttpClient(
    process.env.NEXT_PUBLIC_CONVEX_URL!,
  );

  // Set auth token if available
  if (token) {
    convex.setAuth(token);
  }

  return convex;
};

export const contactsRouter = {
  // Contact CRUD operations
  create: protectedProcedure
    .input(ContactSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.mutation("contacts:createContact", {
          userId: ctx.session.user.id,
          contactData: input,
        });

        return result;
      } catch (error) {
        console.error("Failed to create contact:", error);
        throw new Error("Failed to create contact");
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: ContactSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.mutation("contacts:updateContact", {
          contactId: input.id,
          updates: input.data,
        });

        return result;
      } catch (error) {
        console.error("Failed to update contact:", error);
        throw new Error("Failed to update contact");
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.mutation("contacts:deleteContact", {
          contactId: input.id,
        });

        return result;
      } catch (error) {
        console.error("Failed to delete contact:", error);
        throw new Error("Failed to delete contact");
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.query("contacts:getContactById", {
          contactId: input.id,
        });

        return result;
      } catch (error) {
        console.error("Failed to get contact:", error);
        throw new Error("Failed to get contact");
      }
    }),

  list: protectedProcedure
    .input(
      z.object({
        pagination: PaginationOptsSchema,
        filters: ContactFilterSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.query("contacts:getContacts", {
          userId: ctx.session.user.id,
          paginationOpts: input.pagination,
          filters: input.filters ?? {},
        });

        return result;
      } catch (error) {
        console.error("Failed to list contacts:", error);
        throw new Error("Failed to list contacts");
      }
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        pagination: PaginationOptsSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.query("contacts:searchContacts", {
          userId: ctx.session.user.id,
          searchQuery: input.query,
          paginationOpts: input.pagination,
        });

        return result;
      } catch (error) {
        console.error("Failed to search contacts:", error);
        throw new Error("Failed to search contacts");
      }
    }),

  // Tag management
  addTag: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        tag: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.mutation("contacts:addContactTag", {
          contactId: input.contactId,
          tag: input.tag,
        });

        return result;
      } catch (error) {
        console.error("Failed to add tag:", error);
        throw new Error("Failed to add tag");
      }
    }),

  removeTag: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        tag: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.mutation("contacts:removeContactTag", {
          contactId: input.contactId,
          tag: input.tag,
        });

        return result;
      } catch (error) {
        console.error("Failed to remove tag:", error);
        throw new Error("Failed to remove tag");
      }
    }),

  // Organization operations
  createOrganization: protectedProcedure
    .input(OrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.mutation("contacts:createOrganization", {
          userId: ctx.session.user.id,
          organizationData: input,
        });

        return result;
      } catch (error) {
        console.error("Failed to create organization:", error);
        throw new Error("Failed to create organization");
      }
    }),

  updateOrganization: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: OrganizationSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.mutation("contacts:updateOrganization", {
          organizationId: input.id,
          updates: input.data,
        });

        return result;
      } catch (error) {
        console.error("Failed to update organization:", error);
        throw new Error("Failed to update organization");
      }
    }),

  deleteOrganization: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.mutation("contacts:deleteOrganization", {
          organizationId: input.id,
        });

        return result;
      } catch (error) {
        console.error("Failed to delete organization:", error);
        throw new Error("Failed to delete organization");
      }
    }),

  // Contact-Organization relationship
  addToOrganization: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        organizationId: z.string(),
        role: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.mutation(
          "contacts:addContactToOrganization",
          {
            contactId: input.contactId,
            organizationId: input.organizationId,
            role: input.role,
          },
        );

        return result;
      } catch (error) {
        console.error("Failed to add contact to organization:", error);
        throw new Error("Failed to add contact to organization");
      }
    }),

  removeFromOrganization: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        organizationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.mutation(
          "contacts:removeContactFromOrganization",
          {
            contactId: input.contactId,
            organizationId: input.organizationId,
          },
        );

        return result;
      } catch (error) {
        console.error("Failed to remove contact from organization:", error);
        throw new Error("Failed to remove contact from organization");
      }
    }),

  // Import/Export
  importContacts: protectedProcedure
    .input(
      z.object({
        contacts: z.array(ContactSchema),
        options: z
          .object({
            skipDuplicates: z.boolean().default(true),
            updateExisting: z.boolean().default(false),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.mutation("contacts:importContacts", {
          userId: ctx.session.user.id,
          contacts: input.contacts,
          options: input.options,
        });

        return result;
      } catch (error) {
        console.error("Failed to import contacts:", error);
        throw new Error("Failed to import contacts");
      }
    }),

  exportContacts: protectedProcedure
    .input(
      z.object({
        filters: ContactFilterSchema.optional(),
        format: z.enum(["json", "csv"]).default("csv"),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new Error("Not authenticated");
      }

      const convex = await getConvexClient(ctx.token);

      try {
        const result = await convex.query("contacts:exportContacts", {
          userId: ctx.session.user.id,
          filters: input.filters ?? {},
          format: input.format,
        });

        return result;
      } catch (error) {
        console.error("Failed to export contacts:", error);
        throw new Error("Failed to export contacts");
      }
    }),

  // Dashboard and statistics
  getContactStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user) {
      throw new Error("Not authenticated");
    }

    const convex = await getConvexClient(ctx.token);

    try {
      const result = await convex.query("contacts:getContactStats", {
        userId: ctx.session.user.id,
      });

      return result;
    } catch (error) {
      console.error("Failed to get contact stats:", error);
      throw new Error("Failed to get contact stats");
    }
  }),
} satisfies TRPCRouterRecord;
