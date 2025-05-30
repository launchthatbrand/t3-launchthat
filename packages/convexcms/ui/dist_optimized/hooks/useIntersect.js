'use client';

import { c as _c } from "react/compiler-runtime";
import { useEffect, useRef, useState } from 'react';
export const useIntersect = (t0, disable) => {
  const $ = _c(14);
  let t1;
  if ($[0] !== t0) {
    t1 = t0 === undefined ? {} : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const {
    root: t2,
    rootMargin: t3,
    threshold: t4
  } = t1;
  const root = t2 === undefined ? null : t2;
  const rootMargin = t3 === undefined ? "0px" : t3;
  const threshold = t4 === undefined ? 0 : t4;
  const [entry, updateEntry] = useState();
  const [node, setNode] = useState(null);
  let t5;
  if ($[2] !== disable || $[3] !== root || $[4] !== rootMargin || $[5] !== threshold) {
    t5 = typeof window !== "undefined" && "IntersectionObserver" in window && !disable ? new window.IntersectionObserver(t6 => {
      const [ent] = t6;
      return updateEntry(ent);
    }, {
      root,
      rootMargin,
      threshold
    }) : null;
    $[2] = disable;
    $[3] = root;
    $[4] = rootMargin;
    $[5] = threshold;
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  const observer = useRef(t5);
  let t6;
  let t7;
  if ($[7] !== disable || $[8] !== node) {
    t6 = () => {
      if (disable) {
        return;
      }
      const {
        current: currentObserver
      } = observer;
      currentObserver.disconnect();
      if (node) {
        currentObserver.observe(node);
      }
      return () => currentObserver.disconnect();
    };
    t7 = [node, disable];
    $[7] = disable;
    $[8] = node;
    $[9] = t6;
    $[10] = t7;
  } else {
    t6 = $[9];
    t7 = $[10];
  }
  useEffect(t6, t7);
  let t8;
  if ($[11] !== entry || $[12] !== node) {
    t8 = [setNode, entry, node];
    $[11] = entry;
    $[12] = node;
    $[13] = t8;
  } else {
    t8 = $[13];
  }
  return t8;
};
//# sourceMappingURL=useIntersect.js.map