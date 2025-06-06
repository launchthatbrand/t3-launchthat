"use client";

import { useCallback, useState } from "react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

interface ToastOptions {
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({ title, description, action, variant = "default" }: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { id, title, description, action, variant };

      setToasts((prev) => [...prev, newToast]);

      return id;
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toast,
    dismiss,
    dismissAll,
    toasts,
  };
};

export type ToastActionElement = React.ReactElement<
  {
    altText: string;
    onClick: () => void;
  },
  React.ElementType
>;
