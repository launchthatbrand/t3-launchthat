import type { Doc, Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";

export async function getEmailSettingsByAliasHelper(
  ctx: QueryCtx,
  aliasLocalPart: string,
): Promise<Doc<"supportEmailSettings"> | null> {
  const normalized = aliasLocalPart.toLowerCase();
  return ctx.db
    .query("supportEmailSettings")
    .withIndex("by_alias_local_part", (q) =>
      q.eq("defaultAliasLocalPart", normalized),
    )
    .unique();
}
