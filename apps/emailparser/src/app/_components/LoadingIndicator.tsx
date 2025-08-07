"use client";

import type { FC } from "react";
import { useEmailParserStore } from "../../store";

export const LoadingIndicator: FC = () => {
  const isLoading = useEmailParserStore((s) => s.isLoading);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
      <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-gray-700">Loading...</p>
      </div>
    </div>
  );
};
