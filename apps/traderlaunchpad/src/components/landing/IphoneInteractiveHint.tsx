"use client";

import { MousePointerClick } from "lucide-react";
import React from "react";
import { cn } from "@acme/ui";
import { motion } from "motion/react";

export const IphoneInteractiveHint = ({ className }: { className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("pointer-events-none absolute", className)}
    >
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative max-w-[210px] rounded-2xl border border-white/10 bg-black/55 px-3 py-2.5 text-left shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        {/* subtle border glow */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-orange-500/14 via-transparent to-white/6 opacity-70" />

        <div className="relative flex items-center gap-2">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <div className="pointer-events-none absolute inset-0 rounded-full bg-orange-500/10 blur-sm" />
            <MousePointerClick className="relative h-4 w-4 text-orange-200/90" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white/85">
              Interactive demo
            </div>
            <div className="mt-0.5 text-[11px] leading-snug text-white/60">
              Click a notification to open details
            </div>
          </div>
        </div>

        {/* pointer */}
        <div className="pointer-events-none absolute top-6 -right-2 h-4 w-4 rotate-45 border-r border-b border-white/10 bg-black/55 shadow-[10px_10px_30px_rgba(0,0,0,0.35)]" />
        <div className="pointer-events-none absolute top-6 -right-2 h-4 w-4 rotate-45 bg-linear-to-br from-orange-500/10 via-transparent to-white/6 opacity-70" />
      </motion.div>
    </motion.div>
  );
};

