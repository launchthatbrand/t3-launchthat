import * as React from "react";

export interface CardData {
  heading: string;
  bgColor: string;
}

export const BaseCard = ({ heading, bgColor }: CardData) => {
  return (
    <div
      className="mx-auto grid h-full w-full place-items-center rounded-4xl px-6 py-16 text-white shadow-2xl"
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
