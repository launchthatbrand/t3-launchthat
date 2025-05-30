import type { Field } from "@convexcms/core";
import { fieldAffectsData, fieldIsID } from "@convexcms/core/shared";

export const formatFields = (fields: Field[], isEditing?: boolean): Field[] =>
  isEditing
    ? fields.filter((field) => !fieldAffectsData(field) || !fieldIsID(field))
    : fields;
