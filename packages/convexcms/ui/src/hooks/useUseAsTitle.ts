"use client";

import type { ClientCollectionConfig, ClientField } from "@convexcms/core";
import { flattenTopLevelFields } from "@convexcms/core/shared";

export const useUseTitleField = (
  collection: ClientCollectionConfig,
): ClientField => {
  const {
    admin: { useAsTitle },
    fields,
  } = collection;

  const topLevelFields = flattenTopLevelFields(fields) as ClientField[];

  return topLevelFields?.find(
    (field) => "name" in field && field.name === useAsTitle,
  );
};
