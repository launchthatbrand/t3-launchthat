"use client";

import "~/app/globals.css";

import React, { useEffect } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import type { NavItem } from "@acme/ui";
import { cn } from "@acme/ui";

import { env } from "~/env";
import useEditorStore from "~/store/useEditorStore";
import { StandardLayoutWrapper } from "../providers";

const _headerNavItems: NavItem[] = [
  { title: "Groups", url: "/groups" },
  { title: "Downloads", url: "/downloads" },
  { title: "Store", url: "/store" },
  { title: "Invitations", url: "/invitations" },
  { title: "Cart", url: "/cart" },
  { title: "User", url: "/user" },
];

const _sidebarNavItems: NavItem[] = [
  { title: "Groups", url: "/groups" },
  { title: "Downloads", url: "/downloads" },
  { title: "Store", url: "/store" },
  { title: "Invitations", url: "/invitations" },
  { title: "Cart", url: "/cart" },
  { title: "User", url: "/user" },
];

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

/**
 * EditorModeDetector for embed layout
 */
function EmbedEditorModeDetector() {
  const searchParams = new URLSearchParams(window.location.search);
  const setEditorMode = useEditorStore((state) => state.setEditorMode);

  useEffect(() => {
    const isEditorMode = searchParams.get("editor") === "true";
    setEditorMode(isEditorMode);
  }, [searchParams, setEditorMode]);

  return null;
}

export default function EmbedLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <ConvexProvider client={convex}>
          <EmbedEditorModeDetector />
          <StandardLayoutWrapper
            appName="Portal Demo"
            sidebar={props.sidebar}
            header={props.header}
            sidebarVariant="inset"
          >
            {props.children}
          </StandardLayoutWrapper>
        </ConvexProvider>
      </body>
    </html>
  );
}
