import * as React from "react";

import AppHeader from "@acme/ui/layout/AppHeader";
import { TraderLaunchpadNavUser } from "~/components/auth/TraderLaunchpadNavUser";

export default function AdminHeaderDefault() {
  return (
    <div className="sticky top-0 z-50">
      <AppHeader
        appName="Trader Launchpad"
        sidebarToggle={true}
        showLogo={false}
        className="border-white/10 bg-black/40 text-white backdrop-blur-md"
        // image="/images/tl-logo-1.png"
        rightSlot={<TraderLaunchpadNavUser afterSignOutUrl="/" />}
      />
    </div>
  );
}