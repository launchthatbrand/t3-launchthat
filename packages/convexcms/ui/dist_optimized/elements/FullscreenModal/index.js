'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { Modal } from '@faceless-ui/modal';
import React from 'react';
import { useEditDepth } from '../../providers/EditDepth/index.js';
export function FullscreenModal(props) {
  const $ = _c(6);
  const currentDepth = useEditDepth();
  let t0;
  if ($[0] !== props.style) {
    t0 = props.style || {};
    $[0] = props.style;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const t1 = `calc(100 + ${currentDepth || 0} + 1)`;
  let t2;
  if ($[2] !== props || $[3] !== t0 || $[4] !== t1) {
    t2 = _jsx(Modal, {
      ...props,
      style: {
        ...t0,
        zIndex: t1
      }
    });
    $[2] = props;
    $[3] = t0;
    $[4] = t1;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}
//# sourceMappingURL=index.js.map