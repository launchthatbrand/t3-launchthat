import { PORTAL_TENANT_SLUG } from "../../../constants";
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const crmOrganizationIdValidator = v.union(
  v.id("organizations"),
  v.literal(PORTAL_TENANT_SLUG),
);

const contactsTable = defineTable({
  organizationId: crmOrganizationIdValidator,
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
  .index("by_org_email", ["organizationId", "email"])
  .index("by_createdBy", ["createdBy"]);

export const contactsSchema = {
  contacts: contactsTable,
};
