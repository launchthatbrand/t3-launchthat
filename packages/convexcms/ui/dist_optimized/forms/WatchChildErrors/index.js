"use client";

import { useThrottledEffect } from "../../hooks/useThrottledEffect.js";
import { useAllFormFields, useFormSubmitted } from "../Form/context.js";
import { buildPathSegments } from "./buildPathSegments.js";
export const WatchChildErrors = ({
  fields,
  path: parentPath,
  setErrorCount
}) => {
  const [formState] = useAllFormFields();
  const hasSubmitted = useFormSubmitted();
  const segmentsToMatch = buildPathSegments(fields);
  useThrottledEffect(() => {
    if (hasSubmitted) {
      let errorCount = 0;
      Object.entries(formState).forEach(([key]) => {
        const matchingSegment = segmentsToMatch?.some(segment => {
          const segmentToMatch = [...parentPath, segment].join(".");
          // match fields with same parent path
          if (segmentToMatch.endsWith(".")) {
            return key.startsWith(segmentToMatch);
          }
          // match fields with same path
          return key === segmentToMatch;
        });
        if (matchingSegment) {
          const pathState = formState[key];
          if ("valid" in pathState && !pathState.valid) {
            errorCount += 1;
          }
        }
      });
      setErrorCount(errorCount);
    }
  }, 250, [formState, hasSubmitted, fields]);
  return null;
};
//# sourceMappingURL=index.js.map