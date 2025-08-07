"use client";

import type { FC} from "react";
import { useEffect } from "react";
import { toast } from "sonner";

import { useEmailParserStore } from "../../store";

// This component is a bridge to show toast messages from the store using sonner
export const Toast: FC = () => {
  const storeToast = useEmailParserStore((s) => s.toast);
  const clearToast = useEmailParserStore((s) => s.clearToast);

  useEffect(() => {
    if (storeToast) {
      // Show the toast using sonner based on the type from the store
      switch (storeToast.type) {
        case "success":
          toast.success(storeToast.message);
          break;
        case "error":
          toast.error(storeToast.message);
          break;
        case "info":
          toast.info(storeToast.message);
          break;
        default:
          toast(storeToast.message);
      }

      // Clear the toast from the store
      clearToast();
    }
  }, [storeToast, clearToast]);

  // This component doesn't render anything directly
  // It only serves to bridge the store with the sonner toast library
  return null;
};
