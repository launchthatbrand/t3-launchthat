"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useCallback } from "react";
export const EntityVisibilityContext = /*#__PURE__*/createContext({});
export const EntityVisibilityProvider = ({
  children,
  visibleEntities
}) => {
  const isEntityVisible = useCallback(({
    collectionSlug,
    globalSlug
  }) => {
    if (collectionSlug) {
      return visibleEntities.collections.includes(collectionSlug);
    }
    if (globalSlug) {
      return visibleEntities.globals.includes(globalSlug);
    }
    return false;
  }, [visibleEntities]);
  return /*#__PURE__*/_jsx(EntityVisibilityContext, {
    value: {
      isEntityVisible,
      visibleEntities
    },
    children: children
  });
};
export const useEntityVisibility = () => use(EntityVisibilityContext);
//# sourceMappingURL=index.js.map