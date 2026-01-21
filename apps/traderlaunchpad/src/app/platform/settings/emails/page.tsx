import { Card, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { EmailSettingsClient } from "~/components/email/EmailSettingsClient";

export default function PlatformSettingsEmailsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>
            Configure organization email domain and sender settings (Resend).
          </CardDescription>
        </CardHeader>
      </Card>

      <EmailSettingsClient />
    </div>
  );
}

