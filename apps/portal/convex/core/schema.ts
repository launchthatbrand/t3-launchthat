import { auditLogSchema } from "./auditLog/schema";
import { categoriesSchema } from "./categories/schema";
import { contentTypesSchema } from "./contentTypes/schema";
import { mediaSchema } from "./media/schema";
import { menusSchema } from "./menus/schema";
import { optionsSchema } from "./options/schema";
import { organizationsSchema } from "./organizations/schema";
import { permissionsSchema } from "./permissions/schema";
import { postsSchema } from "./posts/schema";
import { rolesSchema } from "./roles/schema";
import { tagsSchema } from "./tags/schema";

export const coreSchema = {
  ...auditLogSchema,
  ...categoriesSchema,
  ...contentTypesSchema,
  ...mediaSchema,
  ...menusSchema,
  ...optionsSchema,
  ...organizationsSchema,
  ...permissionsSchema,
  ...postsSchema,
  ...rolesSchema,
  ...tagsSchema,
};
