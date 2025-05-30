'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { useIntersect } from '../../hooks/useIntersect.js';
import './index.scss';
export const Tooltip = props => {
  const $ = _c(26);
  const {
    alignCaret: t0,
    boundingRef,
    children,
    className,
    delay: t1,
    position: positionFromProps,
    show: t2,
    staticPositioning: t3
  } = props;
  const alignCaret = t0 === undefined ? "center" : t0;
  const delay = t1 === undefined ? 350 : t1;
  const showFromProps = t2 === undefined ? true : t2;
  const staticPositioning = t3 === undefined ? false : t3;
  const [show, setShow] = React.useState(showFromProps);
  const [position, setPosition] = React.useState("top");
  const getTitleAttribute = _temp;
  const t4 = boundingRef?.current || null;
  let t5;
  if ($[0] !== t4) {
    t5 = {
      root: t4,
      rootMargin: "-145px 0px 0px 100px",
      threshold: 0
    };
    $[0] = t4;
    $[1] = t5;
  } else {
    t5 = $[1];
  }
  const [ref, intersectionEntry] = useIntersect(t5, staticPositioning);
  let t6;
  let t7;
  if ($[2] !== delay || $[3] !== showFromProps) {
    t6 = () => {
      let timerID;
      if (delay && showFromProps) {
        timerID = setTimeout(() => {
          setShow(showFromProps);
        }, delay);
      } else {
        setShow(showFromProps);
      }
      return () => {
        if (timerID) {
          clearTimeout(timerID);
        }
      };
    };
    t7 = [showFromProps, delay];
    $[2] = delay;
    $[3] = showFromProps;
    $[4] = t6;
    $[5] = t7;
  } else {
    t6 = $[4];
    t7 = $[5];
  }
  useEffect(t6, t7);
  let t8;
  if ($[6] !== intersectionEntry?.isIntersecting || $[7] !== staticPositioning) {
    t8 = () => {
      if (staticPositioning) {
        return;
      }
      setPosition(intersectionEntry?.isIntersecting ? "top" : "bottom");
    };
    $[6] = intersectionEntry?.isIntersecting;
    $[7] = staticPositioning;
    $[8] = t8;
  } else {
    t8 = $[8];
  }
  let t9;
  if ($[9] !== intersectionEntry || $[10] !== staticPositioning) {
    t9 = [intersectionEntry, staticPositioning];
    $[9] = intersectionEntry;
    $[10] = staticPositioning;
    $[11] = t9;
  } else {
    t9 = $[11];
  }
  useEffect(t8, t9);
  let t10;
  if ($[12] !== alignCaret || $[13] !== children || $[14] !== className || $[15] !== position || $[16] !== positionFromProps || $[17] !== ref || $[18] !== show || $[19] !== staticPositioning) {
    const t11 = show && "tooltip--show";
    const t12 = `tooltip--caret-${alignCaret}`;
    const t13 = `tooltip--position-${positionFromProps || position}`;
    let t14;
    if ($[21] !== className || $[22] !== t11 || $[23] !== t12 || $[24] !== t13) {
      t14 = ["tooltip", className, t11, t12, t13].filter(Boolean);
      $[21] = className;
      $[22] = t11;
      $[23] = t12;
      $[24] = t13;
      $[25] = t14;
    } else {
      t14 = $[25];
    }
    t10 = _jsxs(React.Fragment, {
      children: [!staticPositioning && _jsx("aside", {
        "aria-hidden": "true",
        className: ["tooltip", className, `tooltip--caret-${alignCaret}`, "tooltip--position-top"].filter(Boolean).join(" "),
        ref,
        style: {
          opacity: "0"
        },
        children: _jsx("div", {
          className: "tooltip-content",
          children
        })
      }), _jsx("aside", {
        className: t14.join(" "),
        title: getTitleAttribute(children),
        children: _jsx("div", {
          className: "tooltip-content",
          children
        })
      })]
    });
    $[12] = alignCaret;
    $[13] = children;
    $[14] = className;
    $[15] = position;
    $[16] = positionFromProps;
    $[17] = ref;
    $[18] = show;
    $[19] = staticPositioning;
    $[20] = t10;
  } else {
    t10 = $[20];
  }
  return t10;
};
function _temp(content) {
  return typeof content === "string" ? content : "";
}
//# sourceMappingURL=index.js.map