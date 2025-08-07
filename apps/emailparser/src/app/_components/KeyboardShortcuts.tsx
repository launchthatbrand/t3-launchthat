"use client";

import type { FC} from "react";
import { useEffect } from "react";

import { useEmailParserStore } from "../../store";

export const KeyboardShortcuts: FC = () => {
  const setJsonPreviewOpen = useEmailParserStore((s) => s.setJsonPreviewOpen);
  const isJsonPreviewOpen = useEmailParserStore((s) => s.isJsonPreviewOpen);
  const showToast = useEmailParserStore((s) => s.showToast);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close modals
      if (e.key === "Escape") {
        if (isJsonPreviewOpen) {
          setJsonPreviewOpen(false);
        }
      }

      // Ctrl+J to toggle JSON preview
      if (e.key === "j" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setJsonPreviewOpen(!isJsonPreviewOpen);
        showToast(
          "info",
          isJsonPreviewOpen ? "JSON preview closed" : "JSON preview opened",
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isJsonPreviewOpen, setJsonPreviewOpen, showToast]);

  // This component doesn't render anything
  return null;
};
