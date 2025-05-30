/* eslint-disable react-compiler/react-compiler */
"use client";

// Import Clerk provider and hook
import React from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { SidebarProvider } from "@acme/ui/components/sidebar";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { env } from "~/env";
// Import the correct Convex provider for Clerk integration
import { ConvexUserEnsurer } from "./ConvexUserEnsurer";
import { GuestCartMerger } from "./GuestCartMerger";

// Ensure Clerk key exists, otherwise ClerkProvider will error
if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Initialize Convex client within the Client Component

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Wrap everything with ClerkProvider - key is now guaranteed to be a string
    <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <SidebarProvider>
          <ConvexUserEnsurer />
          <GuestCartMerger />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <div className="absolute bottom-4 right-4">
              <ThemeToggle />
            </div>
            <Toaster />
          </ThemeProvider>
        </SidebarProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
