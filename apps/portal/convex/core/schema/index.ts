import { defineSchema } from "convex/server";
import { permissionsSchema } from "./permissionsSchema";
import { postsSchema } from "./postsSchema";
import { rolesSchema } from "./rolesSchema";

export const coreSchema = defineSchema({
  ...permissionsSchema.tables,
  ...rolesSchema.tables,
  ...postsSchema.tables,
});
