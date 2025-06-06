"use client";

import { DashboardHeader } from "../../../../components/dashboard/DashboardHeader";
import { DashboardShell } from "../../../../components/dashboard/DashboardShell";
import { FeedItemSharing } from "../../../../components/social/FeedItemSharing";

export default function ShareDemoPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Content Sharing"
        description="Demonstration of content sharing functionality across the platform"
      />
      <div className="grid gap-4">
        <FeedItemSharing />
      </div>
    </DashboardShell>
  );
}
