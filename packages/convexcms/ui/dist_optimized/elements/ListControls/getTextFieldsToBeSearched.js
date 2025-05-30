"use client";

import { fieldAffectsData, flattenTopLevelFields } from "@convexcms/core/shared";
export const getTextFieldsToBeSearched = (listSearchableFields, fields) => {
  if (listSearchableFields) {
    const flattenedFields = flattenTopLevelFields(fields);
    return flattenedFields.filter(field => fieldAffectsData(field) && listSearchableFields.includes(field.name));
  }
  return null;
};
//# sourceMappingURL=getTextFieldsToBeSearched.js.map