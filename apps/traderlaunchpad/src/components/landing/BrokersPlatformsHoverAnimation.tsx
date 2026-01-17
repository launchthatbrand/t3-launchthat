"use client";

import React from "react";
import { cn } from "@acme/ui";
import { motion } from "motion/react";

const BROKERS: Array<{ name: string; status: "Live" | "Soon" }> = [
  { name: "TradeLocker", status: "Live" },
  { name: "Binance", status: "Live" },
  { name: "MetaTrader", status: "Soon" },
  { name: "TradingView", status: "Soon" },
];

export const BrokersPlatformsHoverAnimation = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <motion.div
      className={cn("relative mt-6", className)}
      initial="rest"
      animate="rest"
      whileHover="hover"
    >
      {/* Subtle HUD grid */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-60">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[26px_26px]" />
        <div className="absolute inset-0 bg-linear-to-b from-orange-500/10 via-transparent to-transparent" />
      </div>

      <div className="relative grid grid-cols-2 gap-2">
        {BROKERS.map((b, idx) => (
          <motion.div
            key={b.name}
            variants={{
              rest: { y: 0, scale: 1, filter: "blur(0px)" },
              hover: {
                y: idx % 2 === 0 ? -2 : 2,
                scale: 1.02,
                filter: "blur(0px)",
              },
            }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-sm"
          >
            {/* Glow sweep on hover */}
            <motion.div
              variants={{
                rest: { opacity: 0, x: "-40%" },
                hover: { opacity: 0.85, x: "120%" },
              }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-transparent via-orange-400/12 to-transparent"
            />

            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0 truncate text-xs font-medium text-white/80">
                {b.name}
              </div>
              <div
                className={[
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  b.status === "Live"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-white/10 bg-white/5 text-white/60",
                ].join(" ")}
              >
                {b.status}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Data-link lines (animate only on hover) */}
      <div className="pointer-events-none absolute inset-0">
        {/* Horizontal */}
        <motion.div
          variants={{
            rest: { opacity: 0, scaleX: 0.75 },
            hover: { opacity: 1, scaleX: 1 },
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute top-1/2 left-4 right-4 h-px origin-center bg-linear-to-r from-transparent via-orange-500/30 to-transparent"
        />
        {/* Vertical */}
        <motion.div
          variants={{
            rest: { opacity: 0, scaleY: 0.75 },
            hover: { opacity: 1, scaleY: 1 },
          }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
          className="absolute left-1/2 top-4 bottom-4 w-px origin-center bg-linear-to-b from-transparent via-orange-500/25 to-transparent"
        />

        {/* Moving pulse dot */}
        <motion.div
          variants={{
            rest: { opacity: 0 },
            hover: { opacity: 1 },
          }}
          transition={{ duration: 0.15 }}
          className="absolute top-1/2 left-4 right-4"
        >
          <motion.div
            initial={{ x: 0 }}
            variants={{
              rest: { x: 0 },
              hover: { x: "calc(100% - 8px)" },
            }}
            transition={{
              duration: 1.05,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="h-2 w-2 -translate-y-1/2 rounded-full bg-orange-400/80 shadow-[0_0_14px_rgba(249,115,22,0.55)]"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

