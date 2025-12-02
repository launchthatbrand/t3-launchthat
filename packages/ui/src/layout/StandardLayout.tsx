// import { AppSidebar } from "./AppSidebar";
import { cn } from "../lib/utils";

import { SidebarInset, SidebarProvider } from "../sidebar";
import { AppSidebar } from "./app-sidebar";
import AppHeader from "./AppHeader";

// import { AppSidebar } from "./AppSidebar";

export default function StandardLayout(props: {
  children?: React.ReactNode;
  sidebar?: React.ReactNode;
  appName: string;
  topbar?: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  sidebarVariant?: "inset" | "floating" | "sidebar";
  showSidebar?: boolean;
  headerRightSlot?: React.ReactNode;
}) {
  const sidebarToggle = props.sidebar !== undefined;
  // If showSidebar is explicitly set to false, hide the sidebar
  // Otherwise, show it if it exists
  const shouldShowSidebar = props.showSidebar !== false && sidebarToggle;

  return (
    <SidebarProvider
    // style={
    //   {
    //     "--sidebar-width": "350px",
    //   } as React.CSSProperties
    // }
    >
      {props.sidebar}
      {/* <AppSidebar sidebar={props.sidebar} /> */}
      <SidebarInset>
        <AppHeader
          appName={props.appName}
          sidebarToggle={sidebarToggle}
          className=""
          rightSlot={props.headerRightSlot}
        />
        {props.children}
      </SidebarInset>
    </SidebarProvider>
  );
}
