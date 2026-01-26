import * as React from "react";

import { AddToHomeScreenHeaderButton } from "launchthat-plugin-pwa/frontend";
import { AnimatedThemeToggler } from "@acme/ui";
import AppHeader from "@acme/ui/layout/AppHeader";
import { OrgWorkspaceHeader } from "~/components/organizations/OrgWorkspaceHeader";
import { TraderLaunchpadNavUser } from "~/components/auth/TraderLaunchpadNavUser";
import { TraderLaunchpadNotificationsMenu } from "~/components/notifications/TraderLaunchpadNotificationsMenu";

export default function AdminHeaderDefault() {
  return (
    <div className="sticky top-0 z-50">
      <AppHeader
        appName="Trader Launchpad"
        sidebarToggle={true}
        showLogo={false}
        className="border-border/40 bg-background/60 text-foreground backdrop-blur-md shadow-sm"
        // image="/images/tl-logo-1.png"
        rightSlot={
          <div className="flex items-center gap-2">
            <AddToHomeScreenHeaderButton
              appName="Trader Launchpad"
              buttonClassName="text-foreground hover:text-foreground"
            />
            {/* <ThemeToggleButton /> */}
            <AnimatedThemeToggler />
            <TraderLaunchpadNotificationsMenu />
            <TraderLaunchpadNavUser afterSignOutUrl="/" />
          </div>
        }
      />
      <OrgWorkspaceHeader />
    </div>
  );
}