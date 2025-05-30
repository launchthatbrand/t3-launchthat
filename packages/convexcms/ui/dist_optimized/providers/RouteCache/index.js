'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { usePathname, useRouter } from 'next/navigation.js';
import React, { createContext, use, useCallback, useEffect } from 'react';
const Context = /*#__PURE__*/createContext({
  clearRouteCache: () => {}
});
export const RouteCache = t0 => {
  const $ = _c(10);
  const {
    children
  } = t0;
  const pathname = usePathname();
  const router = useRouter();
  let t1;
  if ($[0] !== router) {
    t1 = () => {
      router.refresh();
    };
    $[0] = router;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const clearRouteCache = t1;
  let t2;
  if ($[2] !== clearRouteCache) {
    t2 = () => {
      clearRouteCache();
    };
    $[2] = clearRouteCache;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== clearRouteCache || $[5] !== pathname) {
    t3 = [pathname, clearRouteCache];
    $[4] = clearRouteCache;
    $[5] = pathname;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  useEffect(t2, t3);
  let t4;
  if ($[7] !== children || $[8] !== clearRouteCache) {
    t4 = _jsx(Context, {
      value: {
        clearRouteCache
      },
      children
    });
    $[7] = children;
    $[8] = clearRouteCache;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  return t4;
};
export const useRouteCache = () => use(Context);
//# sourceMappingURL=index.js.map