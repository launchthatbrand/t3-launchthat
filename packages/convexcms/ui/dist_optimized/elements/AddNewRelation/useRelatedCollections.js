"use client";

import { useState } from "react";
import { useConfig } from "../../providers/Config/index.js";
export const useRelatedCollections = relationTo => {
  const {
    getEntityConfig
  } = useConfig();
  const [relatedCollections] = useState(() => {
    if (relationTo) {
      const relations = typeof relationTo === "string" ? [relationTo] : relationTo;
      return relations.map(relation => getEntityConfig({
        collectionSlug: relation
      }));
    }
    return [];
  });
  return relatedCollections;
};
//# sourceMappingURL=useRelatedCollections.js.map