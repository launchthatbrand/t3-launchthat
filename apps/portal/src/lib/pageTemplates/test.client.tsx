"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import type { PageTemplateContext } from "./registry";
import { RocketScene } from "./RocketScene";

interface WindowSize {
  width: number;
  height: number;
}

const useWindowSize = (): { size: WindowSize } => {
  const [size, setSize] = useState<WindowSize>({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return { size };
};

interface CardData {
  heading: string;
  bgColor: string;
}

const cardData: CardData[] = [
  { heading: "Section One", bgColor: "#0ea5e9" },
  { heading: "Section Two", bgColor: "#10b981" },
  { heading: "Section Three", bgColor: "#f59e0b" },
  { heading: "Section Four", bgColor: "#ef4444" },
  { heading: "Section Five", bgColor: "#8b5cf6" },
];

const section3Cards: CardData[] = [
  { heading: "Card 1", bgColor: "#111827" },
  { heading: "Card 2", bgColor: "#1f2937" },
  { heading: "Card 3", bgColor: "#0f172a" },
  { heading: "Card 4", bgColor: "#111827" },
  { heading: "Card 5", bgColor: "#1f2937" },
  { heading: "Card 6", bgColor: "#0f172a" },
];

const Card = ({ heading, bgColor }: CardData) => {
  return (
    <div
      className="mx-auto grid h-full w-full place-items-center rounded-3xl px-6 py-16 text-white shadow-2xl"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex w-full flex-col items-center justify-center gap-3 text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
          {heading}
        </h2>
        <p className="max-w-xl text-sm text-pretty text-white/85 md:text-base">
          Sticky section that scales down and fades as you scroll.
        </p>
      </div>
    </div>
  );
};

export const TestHeroTemplate = ({
  post: _post,
  meta: _meta,
}: PageTemplateContext) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section3ViewportRef = useRef<HTMLDivElement>(null);
  const section3RowRef = useRef<HTMLDivElement>(null);
  const { size } = useWindowSize();

  const { scrollY } = useScroll();
  const { scrollYProgress: section3Progress } = useScroll({
    target: section3Ref,
    offset: ["start start", "end end"],
  });

  const [containerTop, setContainerTop] = useState(0);
  const [measuredTitleHeight, setMeasuredTitleHeight] = useState(0);
  const [section3XMax, setSection3XMax] = useState(0);

  useEffect(() => {
    const updateContainerTop = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setContainerTop(window.scrollY + rect.top);
    };

    updateContainerTop();
    window.addEventListener("resize", updateContainerTop);
    return () => window.removeEventListener("resize", updateContainerTop);
  }, []);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;

    const update = () => setMeasuredTitleHeight(el.offsetHeight);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const viewportHeight = size.height || 800;
  const titleHeight = measuredTitleHeight || 240;
  const cardPadding = 80;
  const spacerHeight = 208; // matches h-52

  // Scroll track height for Section 3. Keep it tight so Section 4 arrives soon after
  // the last horizontal card is reached.
  const section3ScrollHeight = section3Cards.length * viewportHeight;

  // Measure the actual horizontal distance needed (contentWidth - viewportWidth).
  useEffect(() => {
    const viewportEl = section3ViewportRef.current;
    const rowEl = section3RowRef.current;
    if (!viewportEl || !rowEl) return;

    const update = () => {
      const viewportWidth = viewportEl.clientWidth;
      const contentWidth = rowEl.scrollWidth;
      setSection3XMax(Math.max(0, contentWidth - viewportWidth));
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(viewportEl);
    ro.observe(rowEl);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);

  const section3XEnd = -section3XMax;
  const section3XEndAt = 0.85;
  const section3X = useTransform(
    section3Progress,
    [0, section3XEndAt, 1],
    [0, section3XEnd, section3XEnd],
  );

  const timeline: [number, number][] = useMemo(() => {
    const cardTimeline: [number, number][] = [];

    // Sections are mostly 1 viewport tall, except section 3 which is a longer scroll track.
    const heights = cardData.map((_, i) =>
      i === 2 ? section3ScrollHeight : viewportHeight,
    );

    let y = containerTop + titleHeight + cardPadding;
    for (const height of heights) {
      const start = y;
      const end = y + height;
      cardTimeline.push([start, end]);
      y = end + spacerHeight;
    }

    return [[containerTop, containerTop + titleHeight], ...cardTimeline];
  }, [containerTop, titleHeight, viewportHeight, section3ScrollHeight]);

  // NOTE: Keep these as explicit hook calls (no loops/maps) to satisfy Rules of Hooks.
  const t0: [number, number] = timeline[0] ?? [0, 1];
  const t1: [number, number] = timeline[1] ?? [0, 1];
  const t2: [number, number] = timeline[2] ?? [0, 1];
  const t3: [number, number] = timeline[3] ?? [0, 1];
  const t4: [number, number] = timeline[4] ?? [0, 1];
  const t5: [number, number] = timeline[5] ?? [0, 1];

  const scale0 = useTransform(scrollY, t0, [1, 0.8]);
  const opacity0 = useTransform(scrollY, t0, [1, 0]);
  const scale1 = useTransform(scrollY, t1, [1, 0.8]);
  const opacity1 = useTransform(scrollY, t1, [1, 0]);
  const scale2 = useTransform(scrollY, t2, [1, 0.8]);
  const opacity2 = useTransform(scrollY, t2, [1, 0]);
  // Section 3 behavior:
  // - pinned while we scroll horizontally (no shrinking)
  // - only shrink/fade near the end as Section 4 begins to arrive
  const t3Hold = t3[0] + (t3[1] - t3[0]) * 0.85;
  const scale3 = useTransform(scrollY, [t3[0], t3Hold, t3[1]], [1, 1, 0.8]);
  const opacity3 = useTransform(scrollY, [t3[0], t3Hold, t3[1]], [1, 1, 0]);
  const scale4 = useTransform(scrollY, t4, [1, 0.8]);
  const opacity4 = useTransform(scrollY, t4, [1, 0]);
  const scale5 = useTransform(scrollY, t5, [1, 0.8]);
  const opacity5 = useTransform(scrollY, t5, [1, 0]);

  const animation = [
    { scale: scale0, opacity: opacity0 },
    { scale: scale1, opacity: opacity1 },
    { scale: scale2, opacity: opacity2 },
    { scale: scale3, opacity: opacity3 },
    { scale: scale4, opacity: opacity4 },
    { scale: scale5, opacity: opacity5 },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white">
      {/* Spacer only (used for timeline math / top offset measurement) */}
      <div ref={titleRef} className="h-0" />

      {cardData.map((data, i) => (
        <React.Fragment key={data.heading}>
          {i === 2 ? (
            <div ref={section3Ref} style={{ height: section3ScrollHeight }}>
              <motion.div
                className="sticky top-5 m-5 h-dvh rounded-3xl bg-red-600 py-20"
                style={{
                  scale: animation[i + 1]?.scale,
                  opacity: animation[i + 1]?.opacity,
                }}
              >
                <div className="flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl px-6 py-10">
                  <div className="flex items-end justify-between">
                    <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
                      Section Three (horizontal)
                    </h2>
                    <p className="text-sm text-white/60">
                      Scroll to move sideways
                    </p>
                  </div>

                  <div className="relative flex-1 overflow-hidden rounded-3xl bg-white/5">
                    <div
                      ref={section3ViewportRef}
                      className="relative h-full w-full overflow-hidden"
                    >
                      <motion.div
                        ref={section3RowRef}
                        className="flex h-full items-stretch gap-6 px-6 py-6"
                        style={{ x: section3X }}
                      >
                        {section3Cards.map((c) => (
                          <div
                            key={c.heading}
                            className="h-full w-full max-w-xl shrink-0 overflow-hidden rounded-3xl shadow-2xl"
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
                                This card moves horizontally as you scroll
                                vertically.
                              </p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <>
              <motion.div
                className="sticky top-5 m-5 h-dvh"
                style={{
                  scale: animation[i + 1]?.scale,
                  opacity: animation[i + 1]?.opacity,
                }}
              >
                {i === 0 ? (
                  <div className="relative h-full w-full overflow-hidden rounded-3xl">
                    <div className="absolute inset-0">
                      <Suspense fallback={null}>
                        <RocketScene />
                      </Suspense>
                    </div>

                    <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/55 via-black/35 to-black/60" />

                    <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
                      <div className="flex max-w-3xl flex-col items-center gap-3 text-center">
                        <h2 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
                          {data.heading}
                        </h2>
                        <p className="text-sm text-pretty text-white/80 md:text-base">
                          RocketScene background for Section One.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Card heading={data.heading} bgColor={data.bgColor} />
                )}
              </motion.div>
              <div className="h-52" />
            </>
          )}
        </React.Fragment>
      ))}

      <div className="h-dvh" />
    </div>
  );
};
