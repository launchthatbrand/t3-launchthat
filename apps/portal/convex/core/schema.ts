import { auditLogSchema } from "./auditLog/schema";
import { authSchema } from "./auth/schema";
import { adminUiLayoutsSchema } from "./adminUiLayouts/schema";
import { downloadsSchema } from "./downloads/schema";
import { emailsSchema } from "./emails/schema";
import { mediaSchema } from "./media/schema";
import { menusSchema } from "./menus/schema";
import { optionsSchema } from "./options/schema";
import { organizationsSchema } from "./organizations/schema";
import { permissionsSchema } from "./permissions/schema";
import { postsSchema } from "./posts/schema";
import { postTypesSchema } from "./postTypes/schema";
import { rolesSchema } from "./roles/schema";
import { taxonomiesSchema } from "./taxonomies/schema";
import { usageSchema } from "./usage/schema";

export const coreSchema = {
  ...authSchema,
  ...auditLogSchema,
  ...adminUiLayoutsSchema,
  ...emailsSchema,
  ...postTypesSchema,
  ...taxonomiesSchema,
  ...downloadsSchema,
  ...mediaSchema,
  ...menusSchema,
  ...optionsSchema,
  ...organizationsSchema,
  ...permissionsSchema,
  ...postsSchema,
  ...rolesSchema,
  ...usageSchema,
};
