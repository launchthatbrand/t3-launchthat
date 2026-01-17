"use client";

import React from "react";
import { Star } from "lucide-react";
import { cn } from "@acme/ui";

export const AffiliateStars = ({
  rating,
  reviewCount,
  className,
}: {
  rating: number;
  reviewCount?: number;
  className?: string;
}) => {
  const full = Math.max(0, Math.min(5, Math.floor(rating)));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, idx) => {
          const isFull = idx < full;
          return (
            <Star
              key={idx}
              className={cn(
                "h-4 w-4",
                isFull
                  ? "fill-orange-400 text-orange-300 drop-shadow-[0_0_10px_rgba(249,115,22,0.35)]"
                  : "text-white/25",
              )}
            />
          );
        })}
      </div>
      <div className="text-xs font-medium text-white/70">
        {rating.toFixed(1)}
        {typeof reviewCount === "number" ? (
          <span className="text-white/35"> • {reviewCount.toLocaleString()}</span>
        ) : null}
      </div>
    </div>
  );
};

