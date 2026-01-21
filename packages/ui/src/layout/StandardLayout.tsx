import { SidebarInset, SidebarProvider } from "../sidebar";

import AppHeader from "./AppHeader";
import { AppSidebar } from "./app-sidebar";
import { SidebarHoverWrapper } from "./SidebarHoverWrapper";
// import { AppSidebar } from "./AppSidebar";
import { cn } from "../lib/utils";

// import { AppSidebar } from "./AppSidebar";

export default function StandardLayout(props: {
  children?: React.ReactNode;
  sidebar?: React.ReactNode;
  appName: string;
  topbar?: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarVariant?: "inset" | "floating" | "sidebar";
  showSidebar?: boolean;
  headerRightSlot?: React.ReactNode;
  sidebarOpenOnHover?: boolean;
  /**
   * Controls whether the sidebar starts open on first paint (desktop).
   * Defaults to true to preserve existing behavior.
   */
  sidebarDefaultOpen?: boolean;
  /**
   * Overrides the collapsed (icon) sidebar width, e.g. "4rem".
   * This maps to the `--sidebar-width-icon` CSS variable in `@acme/ui/sidebar`.
   */
  sidebarWidthIcon?: string;
}) {
  const sidebarToggle = props.sidebar !== undefined;
  // If showSidebar is explicitly set to false, hide the sidebar
  // Otherwise, show it if it exists
  const shouldShowSidebar = props.showSidebar !== false && sidebarToggle;

  const sidebarProviderStyle =
    typeof props.sidebarWidthIcon === "string" && props.sidebarWidthIcon.length > 0
      ? ({ "--sidebar-width-icon": props.sidebarWidthIcon } as React.CSSProperties)
      : undefined;

  return (
    <SidebarProvider
      defaultOpen={props.sidebarDefaultOpen ?? true}
      style={sidebarProviderStyle}
    >
      {shouldShowSidebar ? (
        <SidebarHoverWrapper enabled={props.sidebarOpenOnHover === true}>
          {props.sidebar}
        </SidebarHoverWrapper>
      ) : null}
      {/* <AppSidebar sidebar={props.sidebar} /> */}
      <SidebarInset className={cn("min-h-screen", props.className)}>
        {props.header !== undefined ? (
          props.header
        ) : (
          <AppHeader
            appName={props.appName}
            sidebarToggle={shouldShowSidebar}
            className="bg-background sticky top-0 z-50"
            rightSlot={props.headerRightSlot}
          />
        )}
        {/* <div className="relative w-full max-w-full overflow-x-hidden"> */}
        {props.children}
        {props.footer !== undefined ? props.footer : null}
        {/* </div> */}
      </SidebarInset>
    </SidebarProvider>
  );
}
