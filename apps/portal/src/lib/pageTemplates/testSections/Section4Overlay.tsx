import type { MotionValue } from "framer-motion";
import * as React from "react";

import { ScrollRevealLines } from "~/components/ui/scroll-text";
import { BaseCard } from "./BaseCard";

export const Section4Overlay = ({
  heading,
  bgColor,
  progress,
}: {
  heading: string;
  bgColor: string;
  progress: MotionValue<number>;
}) => {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-4xl">
      <BaseCard heading={heading} bgColor={bgColor} />

      <div className="font-switzer pointer-events-none absolute inset-0 grid place-items-center rounded-4xl bg-yellow-300 px-6">
        <div className="mx-auto w-full max-w-6xl">
          <ScrollRevealLines
            lines={[
              "Section Four",
              "Section Four",
              "Section Four",
              "Section Four",
              "Sticky section that scales down and fades as you scroll.",
            ]}
            progress={progress}
            containerClassName=""
            className="leading-[0.82] font-black tracking-[-0.06em] text-red-600"
            lineClassName={(idx) =>
              idx === 1
                ? "text-[clamp(3rem,10vw,8.25rem)]"
                : "mt-4 max-w-3xl text-pretty text-[clamp(1rem,2.2vw,1.75rem)] font-medium tracking-tight text-red-600/90"
            }
            yFrom={28}
            stagger={0.1}
          />
        </div>
      </div>
    </div>
  );
};
