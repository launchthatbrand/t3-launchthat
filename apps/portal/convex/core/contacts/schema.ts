import { defineTable } from "convex/server";
import { v } from "convex/values";

const contactsTable = defineTable({
  organizationId: v.id("organizations"),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  fullName: v.optional(v.string()),
  company: v.optional(v.string()),
  metadata: v.optional(v.any()),
  tags: v.optional(v.array(v.string())),
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.optional(v.string()),
  updatedBy: v.optional(v.string()),
})
  .index("by_organization", ["organizationId"])
  .index("by_org_email", ["organizationId", "email"]);

export const contactsSchema = {
  contacts: contactsTable,
};
