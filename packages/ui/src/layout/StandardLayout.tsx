"use client";

import { cn } from "@acme/ui";
import { SidebarInset } from "@acme/ui/components/sidebar";

import AppHeader from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

export default function StandardLayout(props: {
  children?: React.ReactNode;
  sidebar?: React.ReactNode;
  appName: string;
  topbar?: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  sidebarVariant?: "inset" | "floating" | "sidebar";
  showSidebar?: boolean;
}) {
  const sidebarToggle = props.sidebar !== undefined;
  // If showSidebar is explicitly set to false, hide the sidebar
  // Otherwise, show it if it exists
  const shouldShowSidebar = props.showSidebar !== false && sidebarToggle;

  return (
    <div className={cn("flex flex-1 flex-col", props.className)}>
      {/* {props.topbar !== undefined ? <TopNavbar /> : null} */}
      <div className="flex flex-1">
        {shouldShowSidebar ? (
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
