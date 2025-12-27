import { auditLogSchema } from "./auditLog/schema";
import { contactsSchema } from "./crm/contacts/schema";
import { downloadsSchema } from "./downloads/schema";
import { emailsSchema } from "./emails/schema";
import { mediaSchema } from "./media/schema";
import { menusSchema } from "./menus/schema";
import { optionsSchema } from "./options/schema";
import { organizationsSchema } from "./organizations/schema";
import { permissionsSchema } from "./permissions/schema";
import { postTypesSchema } from "./postTypes/schema";
import { postsSchema } from "./posts/schema";
import { rolesSchema } from "./roles/schema";
import { taxonomiesSchema } from "./taxonomies/schema";

export const coreSchema = {
  ...contactsSchema,
  ...auditLogSchema,
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
};
