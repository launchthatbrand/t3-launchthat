import React from "react";

import { TraderLaunchpadAccountTab } from "~/components/traderlaunchpad/TraderLaunchpadAccountTab";

export function TraderLaunchpadJournalPage(props: {
  subroute: string;
  organizationId: string;
  viewerUserId: string;
}) {
  // For now, reuse the existing UI and map subroutes to its internal sections.
  // We’ll progressively refactor this into dedicated route-native pages.
  const initialTab =
    props.subroute === "orders" ||
    props.subroute === "settings" ||
    props.subroute === "ideas"
      ? props.subroute
      : "dashboard";

  return (
    <div className="space-y-6">
      <TraderLaunchpadAccountTab mode="journal" initialTab={initialTab} />
    </div>
  );
}


