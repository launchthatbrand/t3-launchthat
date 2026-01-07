import { PORTAL_TENANT_ID, PORTAL_TENANT_SLUG } from "../constants";

import type { MutationCtx } from "../_generated/server";
import { mutation } from "../_generated/server";

type QueryTableName = Parameters<MutationCtx["db"]["query"]>[0];

async function migrateIndexedCollection(
  ctx: MutationCtx,
  table: QueryTableName,
  indexName: string,
  fieldName: string,
) {
  const docs = await ctx.db
    .query(table)
    .withIndex(indexName, (q) => q.eq(fieldName, PORTAL_TENANT_SLUG))
    .collect();

  await Promise.all(
    docs.map((doc) =>
      ctx.db.patch(doc._id, {
        [fieldName]: PORTAL_TENANT_ID,
      }),
    ),
  );

  return docs.length;
}

async function migratePostTypes(ctx: MutationCtx) {
  const docs = await ctx.db.query("postTypes").collect();
  let updated = 0;

  for (const doc of docs) {
    const patches: Partial<typeof doc> = {};
    if (doc.organizationId === PORTAL_TENANT_SLUG) {
      patches.organizationId = PORTAL_TENANT_ID;
    }
    if (doc.enabledOrganizationIds?.includes(PORTAL_TENANT_SLUG)) {
      patches.enabledOrganizationIds = doc.enabledOrganizationIds.map((id) =>
        id === PORTAL_TENANT_SLUG ? PORTAL_TENANT_ID : id,
      );
    }
    if (Object.keys(patches).length > 0) {
      await ctx.db.patch(doc._id, patches);
      updated += 1;
    }
  }

  return updated;
}

export const migratePortalOrganizationIds = mutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      options: await migrateIndexedCollection(
        ctx,
        "options",
        "by_org_and_type",
        "orgId",
      ),
      contacts: await migrateIndexedCollection(
        ctx,
        "contacts",
        "by_organization",
        "organizationId",
      ),
      postTypes: await migratePostTypes(ctx),
    };

    return results;
  },
});
