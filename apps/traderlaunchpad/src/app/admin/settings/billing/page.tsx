import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

export default function AdminSettingsBillingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Manage your plan and payment methods.</CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Coming soon.
      </CardContent>
    </Card>
  );
}

