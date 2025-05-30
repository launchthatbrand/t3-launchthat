"use client";

import type { ClientField } from "@convexcms/core";
import {
  fieldAffectsData,
  flattenTopLevelFields,
} from "@convexcms/core/shared";

export const getTextFieldsToBeSearched = (
  listSearchableFields: string[],
  fields: ClientField[],
): ClientField[] => {
  if (listSearchableFields) {
    const flattenedFields = flattenTopLevelFields(fields) as ClientField[];

    return flattenedFields.filter(
      (field) =>
        fieldAffectsData(field) && listSearchableFields.includes(field.name),
    );
  }

  return null;
};
