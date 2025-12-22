import { auditLogSchema } from "./auditLog/schema";
import { categoriesSchema } from "./categories/schema";
import { contactsSchema } from "./crm/contacts/schema";
import { mediaSchema } from "./media/schema";
import { menusSchema } from "./menus/schema";
import { optionsSchema } from "./options/schema";
import { organizationsSchema } from "./organizations/schema";
import { permissionsSchema } from "./permissions/schema";
import { postTypesSchema } from "./postTypes/schema";
import { postsSchema } from "./posts/schema";
import { rolesSchema } from "./roles/schema";
import { tagsSchema } from "./tags/schema";
import { taxonomiesSchema } from "./taxonomies/schema";

export const coreSchema = {
  ...contactsSchema,
  ...auditLogSchema,
  ...categoriesSchema,
  ...postTypesSchema,
  ...taxonomiesSchema,
  ...mediaSchema,
  ...menusSchema,
  ...optionsSchema,
  ...organizationsSchema,
  ...permissionsSchema,
  ...postsSchema,
  ...rolesSchema,
  ...tagsSchema,
};
