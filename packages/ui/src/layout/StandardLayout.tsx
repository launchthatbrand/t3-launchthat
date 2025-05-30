"use client";

import type { Metadata, Viewport } from "next";

import { cn } from "@acme/ui";
import {
  Sidebar,
  SidebarInset,
  SidebarRail,
} from "@acme/ui/components/sidebar";

import TopNavbar from "../general/TopNavbar";
import AppHeader from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function StandardLayout(props: {
  children?: React.ReactNode;
  sidebar?: React.ReactNode;
  appName: string;
  topbar?: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  sidebarVariant?: "inset" | "floating" | "sidebar";
}) {
  const sidebarToggle = props.sidebar !== undefined;
  return (
    <div className={cn("flex flex-1 flex-col", props.className)}>
      {/* {props.topbar !== undefined ? <TopNavbar /> : null} */}
      <div className="flex flex-1">
        {props.sidebar !== undefined ? (
          <AppSidebar
            sidebar={props.sidebar}
            className="list-none"
            variant={props.sidebarVariant}
          />
        ) : null}

        <SidebarInset>
          {props.header !== undefined ? (
            props.header
          ) : (
            <AppHeader
              appName={props.appName}
              sidebarToggle={sidebarToggle}
              className=""
            />
          )}
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              {props.children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </div>
  );
}
