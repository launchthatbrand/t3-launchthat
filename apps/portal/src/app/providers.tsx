/* eslint-disable react-compiler/react-compiler */
"use client";

// Import Clerk provider and hook
import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { SessionProvider } from "convex-helpers/react/sessions";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useLocalStorage } from "usehooks-ts";

import StandardLayout from "@acme/ui/layout/StandardLayout";
import { SidebarProvider } from "@acme/ui/sidebar";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { ContentProtectionProvider } from "~/components/access/ContentProtectionProvider";
import { PuckEditor } from "~/components/puckeditor/PuckEditorProvider";
import { env } from "~/env";
import useEditorStore from "~/store/useEditorStore";
import { ConvexUserEnsurer } from "./ConvexUserEnsurer";
// Import the correct Convex provider for Clerk integration
import { GuestCartMerger } from "./GuestCartMerger";

// Ensure Clerk key exists, otherwise ClerkProvider will error
if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Initialize Convex client within the Client Component
const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

/**
 * EditorModeDetector watches for ?editor=true in URL and updates the editor store
 */
function EditorModeDetector() {
  const searchParams = useSearchParams();
  const setEditorMode = useEditorStore((state) => state.setEditorMode);

  useEffect(() => {
    const isEditorMode = searchParams.get("editor") === "true";
    setEditorMode(isEditorMode);
  }, [searchParams, setEditorMode]);

  return null; // This is a utility component with no UI
}

/**
 * StandardLayoutWrapper is a client component that modifies the StandardLayout based on editor mode
 */
function StandardLayoutWrapper(
  props: React.ComponentProps<typeof StandardLayout>,
) {
  const isEditorMode = useEditorStore((state) => state.isEditorMode);

  return <StandardLayout {...props} showSidebar={!isEditorMode} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Wrap everything with ClerkProvider - key is now guaranteed to be a string
    <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <SessionProvider storageKey="cart-session" useStorage={useLocalStorage}>
          <ContentProtectionProvider>
            <SidebarProvider>
              <ConvexUserEnsurer />
              <GuestCartMerger />
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
              >
                <EditorModeDetector />
                <PuckEditor>{children}</PuckEditor>
                <div className="absolute bottom-4 right-4">
                  <ThemeToggle />
                </div>
                <Toaster />
              </ThemeProvider>
            </SidebarProvider>
          </ContentProtectionProvider>
        </SessionProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

// Export components for use in layouts
export { StandardLayoutWrapper };
