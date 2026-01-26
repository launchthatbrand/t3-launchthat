import { Card, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

import { JoinCodesSettingsClient } from "~/components/platform/JoinCodesSettingsClient";

export default function PlatformCrmJoinCodesPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Join codes</CardTitle>
          <CardDescription>
            Issue invite-only codes for platform onboarding waves.
          </CardDescription>
        </CardHeader>
      </Card>

      <JoinCodesSettingsClient />
    </div>
  );
}
