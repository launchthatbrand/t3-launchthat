"use client";

import * as React from "react";

import { useSidebar } from "../sidebar";

export function SidebarHoverWrapper(props: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const { enabled, children } = props;
  const { open, setOpen, isMobile } = useSidebar();
  const openedByHoverRef = React.useRef(false);

  // If the sidebar closes for any reason, clear the hover-open flag.
  React.useEffect(() => {
    if (!open) {
      openedByHoverRef.current = false;
    }
  }, [open]);

  if (!enabled || isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      onMouseEnter={() => {
        if (!open) {
          openedByHoverRef.current = true;
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (openedByHoverRef.current) {
          openedByHoverRef.current = false;
          setOpen(false);
        }
      }}
    >
      {children}
    </div>
  );
}

