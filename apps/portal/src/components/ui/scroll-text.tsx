"use client";

import type { MotionValue } from "framer-motion";
import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import { cn } from "~/lib/utils";

type Range = [number, number];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const useSectionProgress = (
  ref: React.RefObject<HTMLElement>,
  offset?: Range,
) => {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.15"],
  });

  // Optional: remap to a subrange of scrollYProgress (must not be conditional).
  const from = offset?.[0] ?? 0;
  const to = offset?.[1] ?? 1;
  return useTransform(scrollYProgress, [from, to], [0, 1]);
};

export function ScrollRevealLines({
  lines,
  className,
  lineClassName,
  containerClassName,
  progress: externalProgress,
  offset,
  yFrom = 24,
  stagger = 0.12,
}: {
  lines: string[];
  className?: string;
  containerClassName?: string;
  lineClassName?: string | ((index: number) => string);
  /** If provided, drives the animation (0..1) from the parent section. */
  progress?: MotionValue<number>;
  /** Optional subrange of the scroll progress to use (0..1). */
  offset?: Range;
  /** Start Y offset (px) for each line. */
  yFrom?: number;
  /** Stagger factor (0..1 range) applied per line. */
  stagger?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const internalProgress = useSectionProgress(ref, offset);
  const progress = externalProgress ?? internalProgress;

  return (
    <div ref={ref} className={cn("w-full", containerClassName)}>
      <div className={cn("flex flex-col", className)}>
        {lines.map((line, idx) => (
          <RevealLine
            key={`${idx}-${line}`}
            progress={progress}
            index={idx}
            yFrom={yFrom}
            stagger={stagger}
            className={
              typeof lineClassName === "function"
                ? lineClassName(idx)
                : lineClassName
            }
          >
            {line}
          </RevealLine>
        ))}
      </div>
    </div>
  );
}

function RevealLine({
  progress,
  index,
  yFrom,
  stagger,
  className,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  yFrom: number;
  stagger: number;
  className?: string;
  children: React.ReactNode;
}) {
  // Each line gets a slightly shifted window within the 0..1 progress.
  const start = clamp01(index * stagger);
  const end = clamp01(start + 0.35);

  const y = useTransform(progress, [start, end], [yFrom, 0]);
  const opacity = useTransform(progress, [start, end], [0, 1]);

  return (
    <div className="overflow-hidden">
      <motion.div style={{ y, opacity }} className={className}>
        {children}
      </motion.div>
    </div>
  );
}

export function ScrollRevealLetters({
  text,
  className,
  containerClassName,
  progress: externalProgress,
  offset,
  stagger = 0.02,
  maxSpread = 0.65,
  yFrom = 10,
}: {
  text: string;
  className?: string;
  containerClassName?: string;
  /** If provided, drives the animation (0..1) from the parent section. */
  progress?: MotionValue<number>;
  /** Optional subrange of the scroll progress to use (0..1). */
  offset?: Range;
  /** Per-letter stagger (0..1 range) applied per character. */
  stagger?: number;
  /** Upper bound for when the last letter starts (0..1). Lower => reveals faster. */
  maxSpread?: number;
  /** Start Y offset (px) for each character. */
  yFrom?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const internalProgress = useSectionProgress(ref, offset);
  const progress = externalProgress ?? internalProgress;

  // Keep spaces as non-breaking spaces so spacing stays correct.
  const chars = React.useMemo(() => Array.from(text), [text]);
  const total = chars.length;

  return (
    <div ref={ref} className={cn("w-full", containerClassName)}>
      <div className={cn("flex flex-wrap", className)} aria-label={text}>
        {chars.map((ch, idx) => (
          <RevealChar
            key={`${idx}-${ch}`}
            progress={progress}
            index={idx}
            total={total}
            stagger={stagger}
            maxSpread={maxSpread}
            yFrom={yFrom}
          >
            {ch === " " ? "\u00A0" : ch}
          </RevealChar>
        ))}
      </div>
    </div>
  );
}

function RevealChar({
  progress,
  index,
  total,
  stagger,
  maxSpread,
  yFrom,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  stagger: number;
  total: number;
  maxSpread: number;
  yFrom: number;
  children: React.ReactNode;
}) {
  // Ensure the last character ALWAYS finishes by progress=1, even for long strings.
  const denom = Math.max(1, total - 1);
  const spread = Math.min(maxSpread, denom * stagger);
  const start = denom === 0 ? 0 : (index / denom) * spread;
  const end = start + (1 - spread);

  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [yFrom, 0]);

  return (
    <motion.span
      style={{ opacity, y }}
      className="inline-block will-change-transform"
    >
      {children}
    </motion.span>
  );
}
