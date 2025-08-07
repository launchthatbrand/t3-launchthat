"use client";

import type { FC} from "react";
import { useEffect } from "react";

import { useEmailParserStore } from "../../store";

interface MobileTabSwitcherProps {
  className?: string;
}

export const MobileTabSwitcher: FC<MobileTabSwitcherProps> = ({
  className: _ = "",
}) => {
  const activeTab = useEmailParserStore((s) => s.mobileActiveTab);

  useEffect(() => {
    // Update the body data attribute when active tab changes
    document.body.setAttribute("data-active-tab", activeTab);

    // Cleanup on unmount
    return () => {
      document.body.removeAttribute("data-active-tab");
    };
  }, [activeTab]);

  // This component doesn't render anything visible
  return null;
};
