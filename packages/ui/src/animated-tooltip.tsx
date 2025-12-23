"use client";

import React, { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

export type AnimatedTooltipItem = {
  id: string | number;
  name: string;
  designation?: string;
  image?: string;
};

export const AnimatedTooltip = ({
  items,
  renderTrigger,
  itemWrapperClassName = "group relative -mr-4",
  tooltipClassName = "absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-4 py-2 text-xs shadow-xl",
}: {
  items: AnimatedTooltipItem[];
  renderTrigger?: (item: AnimatedTooltipItem) => React.ReactNode;
  itemWrapperClassName?: string;
  tooltipClassName?: string;
}) => {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);
  const animationFrameRef = useRef<number | null>(null);

  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig,
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig,
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const rect = event.currentTarget.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      x.set(offsetX - rect.width / 2);
    });
  };

  return (
    <>
      {items.map((item) => (
        <div
          className={itemWrapperClassName}
          key={String(item.id)}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <AnimatePresence>
            {hoveredId === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className={tooltipClassName}
              >
                <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
                <div className="relative z-30 text-base font-bold text-white">
                  {item.name}
                </div>
                {item.designation ? (
                  <div className="text-xs text-white">{item.designation}</div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
          <div onMouseMove={handleMouseMove}>
            {renderTrigger ? (
              renderTrigger(item)
            ) : item.image ? (
              <img
                height={100}
                width={100}
                src={item.image}
                alt={item.name}
                className="relative !m-0 h-14 w-14 rounded-full border-2 border-white object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105"
              />
            ) : (
              <div className="bg-muted text-muted-foreground relative flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold">
                {item.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
};
