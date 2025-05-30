'use client';

import { arraysHaveSameStrings } from '../../utilities/arraysHaveSameStrings.js';
export const mergeErrorPaths = (existing, incoming) => {
  if (!existing) {
    return {
      changed: false,
      result: undefined
    };
  }
  const existingErrorPaths = [];
  const incomingErrorPaths = [];
  if (Array.isArray(incoming) && incoming?.length) {
    incoming.forEach(path => incomingErrorPaths.push(path));
  }
  if (Array.isArray(existing) && existing?.length) {
    existing.forEach(path => existingErrorPaths.push(path));
  }
  if (!arraysHaveSameStrings(existingErrorPaths, incomingErrorPaths)) {
    return {
      changed: true,
      result: incomingErrorPaths
    };
  }
  return {
    changed: false,
    result: existing
  };
};
//# sourceMappingURL=mergeErrorPaths.js.map