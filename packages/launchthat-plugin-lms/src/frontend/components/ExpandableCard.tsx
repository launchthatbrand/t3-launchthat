"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { useOutsideClick } from "../../hooks/use-outside-click";

export type ExpandableCardItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  content: React.ReactNode | (() => React.ReactNode);
};

export interface ExpandableCardProps {
  item: ExpandableCardItem;
  alignWithSidebar?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export function ExpandableCard({
  item,
  alignWithSidebar = false,
  maxWidth = 500,
  maxHeight = 500,
}: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = expanded ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [expanded]);

  useOutsideClick(ref, () => setExpanded(false));

  const overlayContainerClass = alignWithSidebar
    ? "fixed inset-0 z-[100] px-4 lg:pl-[280px]"
    : "fixed inset-0 z-[100] grid place-items-center px-4";

  const cardStyle = {
    maxHeight: `${maxHeight}px`,
    height: `min(${maxHeight}px, 90vh)`,
    width: `min(${maxWidth}px, calc(100vw - 2rem))`,
  };

  return (
    <>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 h-full w-full bg-black/20"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {expanded ? (
          <div className={overlayContainerClass}>
            <div className="relative flex h-full items-center justify-center">
              <motion.button
                key={`button-${item.id}-${id}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.05 },
                }}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm lg:hidden"
                onClick={() => setExpanded(false)}
              >
                ×
              </motion.button>
              <motion.div
                layoutId={`card-${item.id}-${id}`}
                ref={ref}
                className="flex max-w-[500px] flex-col overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-neutral-900"
                style={cardStyle}
              >
                <motion.div layoutId={`image-${item.id}-${id}`}>
                  <img
                    width={600}
                    height={400}
                    src={item.image}
                    alt={item.title}
                    className="h-64 w-full object-cover sm:rounded-t-3xl"
                    loading="lazy"
                  />
                </motion.div>

                <div>
                  <div className="flex items-start justify-between p-6">
                    <div>
                      <motion.h3
                        layoutId={`title-${item.id}-${id}`}
                        className="text-xl font-semibold"
                      >
                        {item.title}
                      </motion.h3>
                      <motion.p
                        layoutId={`description-${item.id}-${id}`}
                        className="text-sm text-muted-foreground"
                      >
                        {item.description}
                      </motion.p>
                    </div>

                    <motion.a
                      layoutId={`button-${item.id}-${id}`}
                      href={item.ctaLink}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      {item.ctaText}
                    </motion.a>
                  </div>
                  <div className="relative px-6 pb-6">
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex h-48 flex-col gap-4 overflow-auto text-sm text-muted-foreground md:h-fit md:pb-6"
                    >
                      {typeof item.content === "function"
                        ? item.content()
                        : item.content}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        ) : null}
      </AnimatePresence>
      <motion.div
        layoutId={`card-${item.id}-${id}`}
        onClick={() => setExpanded(true)}
        className="flex cursor-pointer flex-col items-center justify-between rounded-xl p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 md:flex-row"
      >
        <div className="flex flex-col gap-4 md:flex-row">
          <motion.div layoutId={`image-${item.id}-${id}`}>
            <img
              width={100}
              height={100}
              src={item.image}
              alt={item.title}
              className="h-40 w-40 rounded-lg object-cover object-top md:h-14 md:w-14"
            />
          </motion.div>
          <div>
            <motion.h3
              layoutId={`title-${item.id}-${id}`}
              className="text-center font-medium text-neutral-800 dark:text-neutral-200 md:text-left"
            >
              {item.title}
            </motion.h3>
            <motion.p
              layoutId={`description-${item.id}-${id}`}
              className="text-center text-neutral-600 dark:text-neutral-400 md:text-left"
            >
              {item.description}
            </motion.p>
          </div>
        </div>
        <motion.button
          layoutId={`button-${item.id}-${id}`}
          className="mt-4 rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-black hover:bg-green-500 hover:text-white md:mt-0"
        >
          {item.ctaText}
        </motion.button>
      </motion.div>
    </>
  );
}
