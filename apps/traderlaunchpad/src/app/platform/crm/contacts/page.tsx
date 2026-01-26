"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

import { CrmContactsClient } from "~/components/platform/CrmContactsClient";

export default function PlatformCrmContactsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            Platform-wide CRM contacts and segmentation.
          </CardDescription>
        </CardHeader>
      </Card>
      <CrmContactsClient />
    </div>
  );
}
