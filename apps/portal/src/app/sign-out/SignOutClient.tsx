"use client";

import * as React from "react";
import { useClerk } from "@clerk/nextjs";

export function SignOutClient(props: { returnTo: string }) {
  const { signOut } = useClerk();

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await signOut({ redirectUrl: props.returnTo });
      } catch {
        // If Clerk isn't available for any reason, just navigate back.
        if (!cancelled) {
          window.location.assign(props.returnTo);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [props.returnTo, signOut]);

  return null;
}


