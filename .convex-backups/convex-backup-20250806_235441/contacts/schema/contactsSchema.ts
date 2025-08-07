import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define contacts table (the main CRM entity)
export const contactsTable = defineTable({
  // Basic contact info
  firstName: v.string(),
  lastName: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),

  // Organization info
  company: v.optional(v.string()),
  jobTitle: v.optional(v.string()),
  department: v.optional(v.string()),

  // Address info
  address: v.optional(
    v.object({
      street1: v.string(),
      street2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
    }),
  ),

  // Social profiles
  socialProfiles: v.optional(
    v.object({
      linkedin: v.optional(v.string()),
      twitter: v.optional(v.string()),
      facebook: v.optional(v.string()),
      instagram: v.optional(v.string()),
      website: v.optional(v.string()),
    }),
  ),

  // Categorization
  tags: v.optional(v.array(v.string())),
  leadSource: v.optional(v.string()),
  leadStatus: v.optional(
    v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("dormant"),
    ),
  ),

  // Customer data
  customerType: v.optional(
    v.union(
      v.literal("lead"),
      v.literal("prospect"),
      v.literal("customer"),
      v.literal("former-customer"),
      v.literal("partner"),
    ),
  ),

  // Associated user account (if the contact has a user account)
  userId: v.optional(v.string()),

  // Custom fields (dynamic fields)
  customFields: v.optional(v.any()),

  // Administrative fields
  createdBy: v.string(),
  createdAt: v.number(), // Timestamp
  updatedAt: v.optional(v.number()), // Timestamp
  lastContactedAt: v.optional(v.number()), // Timestamp
  assignedTo: v.optional(v.string()),
  deletedAt: v.optional(v.number()), // Timestamp for soft delete

  // Opt-out and privacy
  emailOptOut: v.optional(v.boolean()),
  smsOptOut: v.optional(v.boolean()),

  // Notes
  notes: v.optional(v.string()),
})
  .index("by_email", ["email"])
  .index("by_company", ["company"])
  .index("by_createdBy", ["createdBy"])
  .index("by_assignedTo", ["assignedTo"])
  .index("by_leadStatus", ["leadStatus"])
  .index("by_customerType", ["customerType"])
  .index("by_userId", ["userId"])
  .searchIndex("search_contacts", {
    searchField: "firstName",
    filterFields: ["customerType", "leadStatus"],
  });

// Define interactions/activities with contacts
export const contactInteractionsTable = defineTable({
  contactId: v.id("contacts"),
  type: v.union(
    v.literal("email"),
    v.literal("call"),
    v.literal("meeting"),
    v.literal("note"),
    v.literal("task"),
    v.literal("purchase"),
  ),
  subject: v.string(),
  description: v.optional(v.string()),
  occurred: v.number(), // Timestamp when the interaction occurred
  scheduledFor: v.optional(v.number()), // For future interactions/tasks
  completed: v.optional(v.boolean()), // For tasks
  attachments: v.optional(
    v.array(
      v.object({
        name: v.string(),
        url: v.string(),
        type: v.string(), // MIME type
      }),
    ),
  ),
  createdBy: v.string(),
  createdAt: v.number(), // Timestamp

  // References to related entities
  dealId: v.optional(v.id("deals")),
  eventId: v.optional(v.id("events")),
  orderId: v.optional(v.id("transactions")),
})
  .index("by_contact", ["contactId"])
  .index("by_type", ["contactId", "type"])
  .index("by_date", ["contactId", "occurred"])
  .index("by_scheduled", ["scheduledFor"])
  .index("by_creator", ["createdBy"])
  .index("by_deal", ["dealId"]);

// Define deals/opportunities
export const dealsTable = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  value: v.number(), // Deal value in cents
  currency: v.string(), // Currency code (e.g., "USD")
  stage: v.union(
    v.literal("prospecting"),
    v.literal("qualification"),
    v.literal("needs-analysis"),
    v.literal("proposal"),
    v.literal("negotiation"),
    v.literal("closed-won"),
    v.literal("closed-lost"),
  ),
  probability: v.optional(v.number()), // Probability of closing (0-100)
  expectedCloseDate: v.optional(v.number()), // Timestamp
  actualCloseDate: v.optional(v.number()), // Timestamp

  // Related entities
  primaryContactId: v.id("contacts"),
  relatedContactIds: v.optional(v.array(v.id("contacts"))),

  // Administrative
  createdBy: v.string(),
  createdAt: v.number(), // Timestamp
  updatedAt: v.optional(v.number()), // Timestamp
  assignedTo: v.optional(v.string()),
})
  .index("by_primaryContact", ["primaryContactId"])
  .index("by_stage", ["stage"])
  .index("by_createdBy", ["createdBy"])
  .index("by_assignedTo", ["assignedTo"])
  .index("by_expectedClose", ["expectedCloseDate"]);

// Define organizations/companies
export const organizationsTable = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  website: v.optional(v.string()),
  industry: v.optional(v.string()),
  employees: v.optional(v.number()),
  revenue: v.optional(v.number()),
  founded: v.optional(v.number()), // Year

  // Address info
  address: v.optional(
    v.object({
      street1: v.string(),
      street2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
    }),
  ),

  // Related contacts
  primaryContactId: v.optional(v.id("contacts")),

  // Administrative
  createdBy: v.string(),
  createdAt: v.number(), // Timestamp
  updatedAt: v.optional(v.number()), // Timestamp
})
  .index("by_name", ["name"])
  .index("by_industry", ["industry"])
  .searchIndex("search_organizations", {
    searchField: "name",
  });

// Link contacts to organizations
export const contactOrganizationsTable = defineTable({
  contactId: v.id("contacts"),
  organizationId: v.id("organizations"),
  role: v.optional(v.string()), // Role within the organization
  isPrimary: v.optional(v.boolean()), // Is this the person's primary organization
})
  .index("by_contact", ["contactId"])
  .index("by_organization", ["organizationId"])
  .index("by_contact_organization", ["contactId", "organizationId"]);

// Export a proper Convex schema using defineSchema
export const contactsSchema = defineSchema({
  contacts: contactsTable,
  contactInteractions: contactInteractionsTable,
  deals: dealsTable,
  organizations: organizationsTable,
  contactOrganizations: contactOrganizationsTable,
});
