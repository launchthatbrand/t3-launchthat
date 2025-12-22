import type { MotionValue } from "framer-motion";
import * as React from "react";

import { ScrollRevealLines } from "~/components/ui/scroll-text";

export const Section5Thanks = ({
  progress,
}: {
  progress: MotionValue<number>;
}) => {
  return (
    <div className="font-switzer relative grid h-full w-full place-items-center overflow-hidden rounded-4xl bg-black">
      <div className="w-full px-6">
        <div className="mx-auto w-full max-w-6xl">
          <ScrollRevealLines
            lines={["THANKS", "FOR YOUR", "ATTENTION", "LETS TALK"]}
            progress={progress}
            containerClassName=""
            className="leading-[0.82] font-black tracking-[-0.06em] text-red-600 uppercase"
            lineClassName="text-[clamp(3rem,10vw,8.25rem)]"
            yFrom={28}
            stagger={0.14}
          />
        </div>
      </div>

      <button
        type="button"
        aria-label="Let's talk"
        className="absolute bottom-10 left-1/2 grid h-24 w-24 -translate-x-1/2 place-items-center rounded-full bg-white text-black shadow-xl"
      >
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M7 17L17 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M9 7h8v8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};
