import React from "react";

/**
 * Vertical grid line overlay used across marketing + directory pages.
 * Stays within the same max width as content (matches homepage).
 */
export const GridLines = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 mx-auto h-full max-w-7xl">
      <div className="absolute top-0 left-4 h-full w-px bg-white/5" />
      <div className="absolute top-0 right-4 h-full w-px bg-white/5" />
      <div className="absolute top-0 left-1/4 hidden h-full w-px bg-white/5 md:block" />
      <div className="absolute top-0 left-2/4 hidden h-full w-px bg-white/5 md:block" />
      <div className="absolute top-0 left-3/4 hidden h-full w-px bg-white/5 md:block" />
    </div>
  );
};

