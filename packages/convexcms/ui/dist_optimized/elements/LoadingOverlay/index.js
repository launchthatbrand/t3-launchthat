'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { createContext } from 'react';
import { LoadingOverlay } from '../../elements/Loading/index.js';
import { useDelayedRender } from '../../hooks/useDelayedRender.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { defaultLoadingOverlayState, reducer } from './reducer.js';
const animatedDuration = 250;
const Context = /*#__PURE__*/createContext({
  isOnScreen: false,
  toggleLoadingOverlay: undefined
});
export const LoadingOverlayProvider = t0 => {
  const $ = _c(21);
  const {
    children
  } = t0;
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== t) {
    t1 = t("general:loading");
    $[0] = t;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const fallbackText = t1;
  const [overlays, dispatchOverlay] = React.useReducer(reducer, defaultLoadingOverlayState);
  let t2;
  if ($[2] !== overlays.isLoading) {
    t2 = {
      delayBeforeShow: 1000,
      inTimeout: animatedDuration,
      minShowTime: 500,
      outTimeout: animatedDuration,
      show: overlays.isLoading
    };
    $[2] = overlays.isLoading;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const {
    isMounted,
    isUnmounting,
    triggerDelayedRender
  } = useDelayedRender(t2);
  let t3;
  if ($[4] !== fallbackText || $[5] !== triggerDelayedRender) {
    t3 = t4 => {
      const {
        type,
        isLoading,
        key,
        loadingText: t5
      } = t4;
      const loadingText = t5 === undefined ? fallbackText : t5;
      if (isLoading) {
        triggerDelayedRender();
        dispatchOverlay({
          type: "add",
          payload: {
            type,
            key,
            loadingText
          }
        });
      } else {
        dispatchOverlay({
          type: "remove",
          payload: {
            type,
            key
          }
        });
      }
    };
    $[4] = fallbackText;
    $[5] = triggerDelayedRender;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const toggleLoadingOverlay = t3;
  let t4;
  if ($[7] !== children || $[8] !== fallbackText || $[9] !== isMounted || $[10] !== isUnmounting || $[11] !== overlays.loadingText || $[12] !== overlays.overlayType || $[13] !== toggleLoadingOverlay) {
    let t5;
    if ($[15] !== fallbackText || $[16] !== isMounted || $[17] !== isUnmounting || $[18] !== overlays.loadingText || $[19] !== overlays.overlayType) {
      t5 = isMounted && _jsx(LoadingOverlay, {
        animationDuration: `${animatedDuration}ms`,
        loadingText: overlays.loadingText || fallbackText,
        overlayType: overlays.overlayType,
        show: !isUnmounting
      });
      $[15] = fallbackText;
      $[16] = isMounted;
      $[17] = isUnmounting;
      $[18] = overlays.loadingText;
      $[19] = overlays.overlayType;
      $[20] = t5;
    } else {
      t5 = $[20];
    }
    t4 = _jsxs(Context, {
      value: {
        isOnScreen: isMounted,
        toggleLoadingOverlay
      },
      children: [t5, children]
    });
    $[7] = children;
    $[8] = fallbackText;
    $[9] = isMounted;
    $[10] = isUnmounting;
    $[11] = overlays.loadingText;
    $[12] = overlays.overlayType;
    $[13] = toggleLoadingOverlay;
    $[14] = t4;
  } else {
    t4 = $[14];
  }
  return t4;
};
export const useLoadingOverlay = () => {
  const contextHook = React.use(Context);
  if (contextHook === undefined) {
    throw new Error('useLoadingOverlay must be used within a LoadingOverlayProvider');
  }
  return contextHook;
};
//# sourceMappingURL=index.js.map