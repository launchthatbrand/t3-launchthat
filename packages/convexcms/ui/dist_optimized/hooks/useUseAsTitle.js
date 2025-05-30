"use client";

import { flattenTopLevelFields } from "@convexcms/core/shared";
export const useUseTitleField = collection => {
  const {
    admin: {
      useAsTitle
    },
    fields
  } = collection;
  const topLevelFields = flattenTopLevelFields(fields);
  return topLevelFields?.find(field => "name" in field && field.name === useAsTitle);
};
//# sourceMappingURL=useUseAsTitle.js.map