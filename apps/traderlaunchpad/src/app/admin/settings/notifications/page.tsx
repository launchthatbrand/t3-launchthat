import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

export default function AdminSettingsNotificationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Configure how you want to be notified.</CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Coming soon.
      </CardContent>
    </Card>
  );
}

