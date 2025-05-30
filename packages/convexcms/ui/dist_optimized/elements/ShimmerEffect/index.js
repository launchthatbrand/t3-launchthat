'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { useDelay } from '../../hooks/useDelay.js';
import './index.scss';
export const ShimmerEffect = ({
  animationDelay = '0ms',
  height = '60px',
  width = '100%'
}) => {
  return /*#__PURE__*/_jsx("div", {
    className: "shimmer-effect",
    style: {
      height: typeof height === 'number' ? `${height}px` : height,
      width: typeof width === 'number' ? `${width}px` : width
    },
    children: /*#__PURE__*/_jsx("div", {
      className: "shimmer-effect__shine",
      style: {
        animationDelay
      }
    })
  });
};
export const StaggeredShimmers = t0 => {
  const $ = _c(7);
  const {
    className,
    count,
    height,
    renderDelay: t1,
    shimmerDelay: t2,
    shimmerItemClassName,
    width
  } = t0;
  const renderDelay = t1 === undefined ? 500 : t1;
  const shimmerDelay = t2 === undefined ? 25 : t2;
  const shimmerDelayToPass = typeof shimmerDelay === "number" ? `${shimmerDelay}ms` : shimmerDelay;
  const [hasDelayed] = useDelay(renderDelay, true);
  if (!hasDelayed) {
    return null;
  }
  let t3;
  if ($[0] !== className || $[1] !== count || $[2] !== height || $[3] !== shimmerDelayToPass || $[4] !== shimmerItemClassName || $[5] !== width) {
    t3 = _jsx("div", {
      className,
      children: [...Array(count)].map((_, i) => _jsx("div", {
        className: shimmerItemClassName,
        children: _jsx(ShimmerEffect, {
          animationDelay: `calc(${i} * ${shimmerDelayToPass})`,
          height,
          width
        })
      }, i))
    });
    $[0] = className;
    $[1] = count;
    $[2] = height;
    $[3] = shimmerDelayToPass;
    $[4] = shimmerItemClassName;
    $[5] = width;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
};
//# sourceMappingURL=index.js.map