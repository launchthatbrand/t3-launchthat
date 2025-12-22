"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { cn } from "~/lib/utils";
import { LayoutTextFlip } from "./layout-text-flip";
import { ScrollRevealLines } from "./scroll-text";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({
  data,
  className,
  scrollContainerRef,
  activeIndex,
  activeSwitchRatio = 0.65,
  activeSwitchOffsetPx = 0,
}: {
  data: TimelineEntry[];
  className?: string;
  /**
   * When provided, the sticky year title will update based on scroll position
   * within this container (useful when Timeline lives inside an overflow scroll area).
   */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** Controlled active item index for the year/title flip. */
  activeIndex?: number;
  /**
   * Where inside the scroll viewport the "switch line" sits (0 = top, 1 = bottom).
   * Higher values switch later.
   */
  activeSwitchRatio?: number;
  /**
   * Fine tune the switch line (px) when using the sticky year line as reference.
   * Positive values switch later.
   */
  activeSwitchOffsetPx?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyYearRef = useRef<HTMLHeadingElement>(null);
  const [height, setHeight] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  useEffect(() => {
    if (typeof activeIndex === "number") return;
    const scroller = scrollContainerRef?.current;
    if (!scroller) return;

    let rafId: number | null = null;

    const computeActiveIndex = () => {
      rafId = null;
      // IMPORTANT: compute in *scroller-local coordinates* so behavior is stable
      // inside overflow containers (and not dependent on window scroll position).
      const scrollerEl = scroller;
      const scrollerRect = scrollerEl.getBoundingClientRect();

      // Default: ratio line inside the scroll viewport.
      let switchY =
        scrollerEl.scrollTop + scrollerEl.clientHeight * activeSwitchRatio;

      // Preferred: align the switch line to the sticky year text line.
      // This matches: "change years when the right content section hits the same line as the text component".
      const stickyRect = stickyYearRef.current?.getBoundingClientRect();
      if (stickyRect && stickyRect.height > 0) {
        switchY =
          scrollerEl.scrollTop +
          (stickyRect.top - scrollerRect.top) +
          activeSwitchOffsetPx;
      }

      let bestIndex = 0;
      for (let i = 0; i < itemRefs.current.length; i += 1) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const itemTop =
          el.getBoundingClientRect().top -
          scrollerRect.top +
          scrollerEl.scrollTop;
        if (itemTop <= switchY) bestIndex = i;
      }

      setInternalActiveIndex((prev) => {
        if (prev === bestIndex) return prev;
        return bestIndex;
      });
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(computeActiveIndex);
    };

    computeActiveIndex();
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      scroller.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [
    activeIndex,
    activeSwitchOffsetPx,
    activeSwitchRatio,
    scrollContainerRef,
  ]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  const resolvedActiveIndex =
    typeof activeIndex === "number" ? activeIndex : internalActiveIndex;
  const titles: string[] = data.map((d) => d.title);

  return (
    <div
      className={cn(
        "w-full bg-white font-sans md:px-10 dark:bg-neutral-950",
        className,
      )}
      ref={containerRef}
    >
      <div className="sticky top-0 mx-auto max-w-7xl px-4 py-20 md:px-8 lg:px-10">
        <ScrollRevealLines
          lines={["WHAT I'VE", "BEEN WORKING", "ON", "RECENTLY"]}
          // progress={progress}
          containerClassName=""
          className="h-full text-center leading-[0.82] font-black tracking-[-0.06em] text-red-600 uppercase"
          lineClassName="text-[clamp(3rem,10vw,8.25rem)]"
          yFrom={28}
          stagger={0.14}
        />
      </div>

      <div
        ref={ref}
        className="justif-start relative mx-auto flex max-w-7xl pb-20"
      >
        <div className="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:mt-40 md:w-full md:flex-row lg:max-w-sm">
          <div className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white md:left-3 dark:bg-black">
            <div className="h-4 w-4 rounded-full border border-neutral-300 bg-neutral-200 p-2 dark:border-neutral-700 dark:bg-neutral-800" />
          </div>
          <h3
            ref={stickyYearRef}
            className="hidden text-xl font-bold text-neutral-500 md:block md:pl-20 md:text-5xl dark:text-neutral-500"
          >
            <LayoutTextFlip
              text=""
              words={titles}
              activeIndex={resolvedActiveIndex}
            />
          </h3>
        </div>
        <div>
          {data.map((item, index) => (
            <div
              key={index}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="flex justify-start pt-10 md:gap-10 md:pt-40"
            >
              <div className="relative w-full pr-4 pl-20 md:pl-4">
                <h3 className="mb-4 block text-left text-2xl font-bold text-neutral-500 md:hidden dark:text-neutral-500">
                  {item.title}
                </h3>
                {item.content}{" "}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            height: height + "px",
          }}
          className="absolute top-0 left-8 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-8 dark:via-neutral-700"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-purple-500 from-[0%] via-blue-500 via-[10%] to-transparent"
          />
        </div>
      </div>
    </div>
  );
};
