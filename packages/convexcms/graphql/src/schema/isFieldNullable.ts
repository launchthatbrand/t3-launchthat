import type { FieldAffectingData } from "@convexcms/core";
import { fieldAffectsData } from "@convexcms/core/shared";

export const isFieldNullable = ({
  field,
  forceNullable,
  parentIsLocalized,
}: {
  field: FieldAffectingData;
  forceNullable: boolean;
  parentIsLocalized: boolean;
}): boolean => {
  const hasReadAccessControl = field.access && field.access.read;
  const condition = field.admin && field.admin.condition;
  return !(
    forceNullable &&
    fieldAffectsData(field) &&
    "required" in field &&
    field.required &&
    (!field.localized || parentIsLocalized) &&
    !condition &&
    !hasReadAccessControl
  );
};
