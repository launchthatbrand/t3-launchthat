import React from "react";

/**
 * Vertical grid line overlay used across marketing + directory pages.
 * Stays within the same max width as content (matches homepage).
 */
export interface GridLinesProps {
  /**
   * Number of vertical guide lines across the content width.
   *
   * Examples:
   * - 3 => left, center, right
   * - 5 => left, (3 evenly spaced), right
   */
  columns?: number;
  className?: string;
}

export const GridLines = ({ columns = 3, className }: GridLinesProps) => {
  const count = Math.max(2, Math.floor(columns));

  return (
    <div
      className={[
        "pointer-events-none absolute inset-0 z-0 mx-auto h-full max-w-7xl px-4",
        className ?? "",
      ].join(" ")}
    >
      <div className="relative h-full w-full">
        {/* Edges always visible */}
        <div className="absolute top-0 left-0 h-full w-px bg-white/5" />
        <div className="absolute top-0 right-0 h-full w-px bg-white/5" />

        {/* Interior columns are hidden on mobile */}
        {Array.from({ length: Math.max(0, count - 2) }).map((_, idx) => {
          const i = idx + 1; // 1..count-2
          const pct = (i / (count - 1)) * 100;
          return (
            <div
              key={`${count}-${i}`}
              className="absolute top-0 hidden h-full w-px -translate-x-1/2 bg-white/5 md:block"
              style={{ left: `${pct}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};

