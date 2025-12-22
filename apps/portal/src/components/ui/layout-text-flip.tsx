"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "~/lib/utils";

export const LayoutTextFlip = ({
  text = "Build Amazing",
  words = ["Landing Pages", "Component Blocks", "Page Sections", "3D Shaders"],
  duration = 3000,
  className,
  activeIndex,
}: {
  text?: string;
  words?: string[];
  duration?: number;
  className?: string;
  /** When provided, the flip is controlled (no interval). */
  activeIndex?: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (typeof activeIndex === "number") {
      setCurrentIndex(activeIndex);
    }
  }, [activeIndex]);

  useEffect(() => {
    if (typeof activeIndex === "number") return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [activeIndex, duration, words.length]);

  return (
    <>
      <motion.span
        layoutId="subtext"
        className={cn(
          "text-2xl font-bold tracking-tight drop-shadow-lg md:text-4xl",
          className,
        )}
      >
        {text}
      </motion.span>

      <motion.span
        layout
        className={cn(
          "relative w-fit overflow-hidden rounded-md border border-transparent bg-white/40 px-4 py-2 font-sans text-2xl font-bold tracking-tight text-black shadow-sm ring shadow-black/10 ring-black/10 drop-shadow-lg md:text-4xl dark:bg-neutral-900 dark:text-white dark:shadow-sm dark:ring-1 dark:shadow-white/10 dark:ring-white/10",
          className,
        )}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentIndex}
            initial={{ y: -40, filter: "blur(10px)" }}
            animate={{
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{ y: 50, filter: "blur(10px)", opacity: 0 }}
            transition={{
              duration: 0.5,
            }}
            className={cn("inline-block whitespace-nowrap", className)}
          >
            {words[currentIndex] ?? ""}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  );
};
