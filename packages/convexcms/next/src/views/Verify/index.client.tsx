"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation.js";
import { toast, useRouteTransition } from "@convexcms/ui";

type Props = {
  message: string;
  redirectTo: string;
};
export function ToastAndRedirect({ message, redirectTo }: Props) {
  const router = useRouter();
  const { startRouteTransition } = useRouteTransition();
  const hasToastedRef = React.useRef(false);

  useEffect(() => {
    let timeoutID;

    if (toast) {
      timeoutID = setTimeout(() => {
        toast.success(message);
        hasToastedRef.current = true;
        startRouteTransition(() => router.push(redirectTo));
      }, 100);
    }

    return () => {
      if (timeoutID) {
        clearTimeout(timeoutID);
      }
    };
  }, [router, redirectTo, message, startRouteTransition]);

  return null;
}
