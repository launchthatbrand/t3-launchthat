import type { MotionValue } from "framer-motion";
import * as React from "react";
import { motion } from "framer-motion";

import type { CardData } from "./BaseCard";

export const section3Cards: CardData[] = [
  { heading: "Card 1", bgColor: "#111827" },
  { heading: "Card 2", bgColor: "#1f2937" },
  { heading: "Card 3", bgColor: "#0f172a" },
  { heading: "Card 4", bgColor: "#111827" },
  { heading: "Card 5", bgColor: "#1f2937" },
  { heading: "Card 6", bgColor: "#0f172a" },
];

export const Section3Horizontal = ({
  x,
  viewportRef,
  rowRef,
}: {
  x: MotionValue<number>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  rowRef: React.RefObject<HTMLDivElement | null>;
}) => {
  return (
    <div className="flex h-full w-full flex-col gap-6 rounded-4xl bg-red-600 px-6 py-10">
      <div className="flex items-end justify-between">
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
          Section Three (horizontal)
        </h2>
        <p className="text-sm text-white/60">Scroll to move sideways</p>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-4xl bg-white/5">
        <div
          ref={viewportRef}
          className="relative h-full w-full overflow-hidden"
        >
          <motion.div
            ref={rowRef}
            className="flex h-full items-stretch gap-6 px-6 py-6"
            style={{ x }}
          >
            {section3Cards.map((c) => (
              <div
                key={c.heading}
                className="h-full w-full max-w-xl shrink-0 overflow-hidden rounded-4xl shadow-2xl"
                style={{ backgroundColor: c.bgColor }}
              >
                <div className="flex h-full flex-col justify-center px-8 py-10 text-white">
                  <div className="text-sm font-medium text-white/70">
                    Section 3
                  </div>
                  <div className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">
                    {c.heading}
                  </div>
                  <p className="mt-4 max-w-md text-sm text-white/70 md:text-base">
                    This card moves horizontally as you scroll vertically.
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
