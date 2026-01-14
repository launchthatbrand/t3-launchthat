import React from "react";

import { TraderLaunchpadJournalTabs } from "~/components/traderlaunchpad/journal/TraderLaunchpadJournalTabs";

export function TraderLaunchpadJournalShell(props: {
  title: string;
  subtitle?: string;
  tabs: { variant: "private" } | { variant: "public"; username: string };
  children: React.ReactNode;
}) {
  return (
    <main className="container mx-auto max-w-5xl flex-1 space-y-6 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{props.title}</h1>
        {props.subtitle ? (
          <p className="text-muted-foreground text-sm">{props.subtitle}</p>
        ) : null}
      </header>

      <TraderLaunchpadJournalTabs {...props.tabs} />

      {props.children}
    </main>
  );
}
