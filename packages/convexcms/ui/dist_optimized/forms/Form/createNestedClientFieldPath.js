"use client";

import { fieldAffectsData } from "@convexcms/core/shared";
export const createNestedClientFieldPath = (parentPath, field) => {
  if (parentPath) {
    if (fieldAffectsData(field)) {
      return `${parentPath}.${field.name}`;
    }
    return parentPath;
  }
  if (fieldAffectsData(field)) {
    return field.name;
  }
  return "";
};
//# sourceMappingURL=createNestedClientFieldPath.js.map