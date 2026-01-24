"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const isProbablyMobile =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(pointer: coarse)").matches ??
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));

  // Avoid expensive blur/translate transitions on mobile devices.
  const shouldAnimate = !reducedMotion && !isProbablyMobile;

  if (!shouldAnimate) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ease: "easeInOut", duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
