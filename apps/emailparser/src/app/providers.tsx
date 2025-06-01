/* eslint-disable react-compiler/react-compiler */
"use client";

import React from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { env } from "../env";
import { ConvexUserEnsurer } from "./ConvexUserEnsurer";

// Create a Convex client
const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ConvexUserEnsurer />
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
