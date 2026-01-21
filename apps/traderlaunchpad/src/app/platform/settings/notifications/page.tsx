import { Card, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

import { NotificationsTestHarnessClient } from "~/components/notifications/NotificationsTestHarnessClient";

export default function PlatformSettingsNotificationsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Send a test notification to yourself (in-app + email).
          </CardDescription>
        </CardHeader>
      </Card>

      <NotificationsTestHarnessClient />
    </div>
  );
}

