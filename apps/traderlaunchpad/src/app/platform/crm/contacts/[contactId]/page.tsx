"use client";

import { useParams } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

import { CrmContactEditorClient } from "~/components/platform/CrmContactEditorClient";

export default function PlatformCrmContactDetailPage() {
  const params = useParams();
  const contactId = typeof params?.contactId === "string" ? params.contactId : "";
  const resolvedContactId = contactId && contactId !== "new" ? contactId : undefined;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {resolvedContactId ? "Contact details" : "New contact"}
          </CardTitle>
          <CardDescription>
            {resolvedContactId
              ? "Manage a CRM contact."
              : "Create a new CRM contact for the platform."}
          </CardDescription>
        </CardHeader>
      </Card>
      <CrmContactEditorClient contactId={resolvedContactId} />
    </div>
  );
}
