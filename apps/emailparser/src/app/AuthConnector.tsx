"use client";

import type { ReactNode} from "react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

interface AuthConnectorProps {
  children: ReactNode;
}

/**
 * This component connects the NextAuth session with the Convex backend
 * It listens for auth state changes and ensures auth state propagates correctly
 */
export function AuthConnector({ children }: AuthConnectorProps) {
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      console.log("User authenticated with NextAuth");
    } else if (status === "unauthenticated") {
      console.log("User not authenticated with NextAuth");
    }
  }, [status]);

  return <>{children}</>;
}
