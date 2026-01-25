import { Card, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { ShortlinksSettingsClient } from "~/components/shortlinks/ShortlinksSettingsClient";

export default function PlatformSettingsShortlinksPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Shortlinks</CardTitle>
          <CardDescription>
            Configure the shortlink domain and code generation settings for TraderLaunchpad.
          </CardDescription>
        </CardHeader>
      </Card>

      <ShortlinksSettingsClient />
    </div>
  );
}

