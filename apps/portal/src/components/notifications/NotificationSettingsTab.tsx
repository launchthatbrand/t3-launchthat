import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

export function NotificationSettingsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="text-muted-foreground">
            Manage your notification preferences.
          </div>
          <Separator />
          <div className="text-muted-foreground">
            In-app notifications are currently supported. Email/SMS preferences
            coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotificationSettingsTab;
