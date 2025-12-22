import * as React from "react";
import { Suspense } from "react";

import { ScrollRevealLines } from "~/components/ui/scroll-text";
import { RocketScene } from "../RocketScene";

export const Section1Rocket = ({ heading }: { heading: string }) => {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-4xl">
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <RocketScene />
        </Suspense>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/55 via-black/35 to-black/60" />

      <div className="pointer-events-none relative z-10 flex h-full w-full items-center justify-center px-6">
        <ScrollRevealLines
          lines={["DESMOND", "TATILIAN"]}
          // progress={progress}
          containerClassName=""
          className="h-full leading-[0.82] font-black tracking-[-0.06em] text-red-600 uppercase"
          lineClassName="text-[clamp(3rem,6vw,8.25rem)]"
          yFrom={28}
          stagger={0.14}
        />
      </div>
    </div>
  );
};
