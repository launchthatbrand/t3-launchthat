"use client";

import React from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  // eslint-disable-next-line no-console
  console.warn(
    "Missing NEXT_PUBLIC_CONVEX_URL; Convex queries will fail until it is set.",
  );
}

const convex = new ConvexReactClient(convexUrl ?? "");

export function Providers(props: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {props.children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}


