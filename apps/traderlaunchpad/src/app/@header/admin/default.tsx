import * as React from "react";

import AppHeader from "@acme/ui/layout/AppHeader";
import { OrgWorkspaceHeader } from "~/components/organizations/OrgWorkspaceHeader";
import { ThemeToggleButton } from "@acme/ui/theme";
import { TraderLaunchpadNavUser } from "~/components/auth/TraderLaunchpadNavUser";
import { TraderLaunchpadNotificationsMenu } from "~/components/notifications/TraderLaunchpadNotificationsMenu";

export default function AdminHeaderDefault() {
  return (
    <div className="sticky top-0 z-50">
      <AppHeader
        appName="Trader Launchpad"
        sidebarToggle={true}
        showLogo={false}
        className="border-white/10 bg-black/40 text-white backdrop-blur-md"
        // image="/images/tl-logo-1.png"
        rightSlot={
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <TraderLaunchpadNotificationsMenu />
            <TraderLaunchpadNavUser afterSignOutUrl="/" />
          </div>
        }
      />
      <OrgWorkspaceHeader />
    </div>
  );
}