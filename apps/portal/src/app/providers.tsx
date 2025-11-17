/* eslint-disable react-compiler/react-compiler */
"use client";

import type { TenantSummary } from "@/lib/tenant-fetcher";
import type { SessionId, UseStorage } from "convex-helpers/react/sessions";
// Import Clerk provider and hook
import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { SessionProvider } from "convex-helpers/react/sessions";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import StandardLayout from "@acme/ui/layout/StandardLayout";
import { SidebarProvider } from "@acme/ui/sidebar";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { ContentProtectionProvider } from "~/components/access/ContentProtectionProvider";
import { TenantProvider } from "~/context/TenantContext";
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

const useSessionStorage: UseStorage<SessionId | undefined> = (key) => {
  const readValue = () =>
    typeof window === "undefined"
      ? undefined
      : (window.localStorage.getItem(key) ?? undefined);

  const [value, setValueState] = useState<SessionId | undefined>(undefined);

  useEffect(() => {
    setValueState(readValue());
  }, [key]);

  const setValue = useCallback(
    (next: SessionId | undefined) => {
      setValueState(next);
      if (typeof window === "undefined") return;
      if (next === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, next);
      }
    },
    [key],
  );

  const remove = useCallback(() => {
    setValue(undefined);
  }, [setValue]);

  return [value, setValue, remove];
};

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

interface ProvidersProps {
  children: React.ReactNode;
  tenant: TenantSummary | null;
}

export function Providers({ children, tenant }: ProvidersProps) {
  return (
    // Wrap everything with ClerkProvider - key is now guaranteed to be a string
    <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <SessionProvider
          storageKey="cart-session"
          useStorage={useSessionStorage}
        >
          <ContentProtectionProvider>
            <TenantProvider value={tenant}>
              <SidebarProvider>
                <ConvexUserEnsurer />
                <GuestCartMerger />
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                >
                  <Suspense fallback={null}>
                    <EditorModeDetector />
                  </Suspense>
                  {/* <PuckEditor> */}
                  {children}
                  {/* </PuckEditor>  */}
                  <div className="absolute bottom-4 right-4">
                    <ThemeToggle />
                  </div>
                  <Toaster />
                </ThemeProvider>
              </SidebarProvider>
            </TenantProvider>
          </ContentProtectionProvider>
        </SessionProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

// Export components for use in layouts
export { StandardLayoutWrapper };
