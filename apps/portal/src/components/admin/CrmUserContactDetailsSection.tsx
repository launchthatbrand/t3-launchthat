"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import Link from "next/link";
import { useQuery } from "convex/react";
import { ContactMarketingTagsManager } from "launchthat-plugin-crm";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { CopyText } from "@acme/ui/copy-text";

// Avoid importing the generated Convex `api` with full types in a client component.
// The generated api types are extremely deep and can trip TS' instantiation limit.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const apiAny = require("@convex-config/_generated/api");

export function CrmUserContactDetailsSection(props: {
  userId: string;
  organizationId?: string | null;
}) {
  const organizationId =
    typeof props.organizationId === "string" ? props.organizationId : undefined;
  const contactId = useQuery(
    apiAny.api.plugins.crm.marketingTags.queries.getContactIdForUser,
    {
      organizationId,
      userId: String(props.userId),
    },
  ) as unknown as string | null | undefined;

  if (contactId === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CRM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Loading CRM…</div>
        </CardContent>
      </Card>
    );
  }

  if (!contactId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CRM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-muted-foreground text-sm">
            No CRM contact is linked to this user.
          </div>
          <div className="text-muted-foreground text-sm">
            To link one, open a contact record and set{" "}
            <Badge variant="outline">contact.userId</Badge> to this user’s id.
          </div>
        </CardContent>
      </Card>
    );
  }

  const contactEditHref = `/admin/edit?post_type=contact&post_id=${encodeURIComponent(contactId)}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>CRM</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href={contactEditHref}>Open contact</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <div className="text-muted-foreground text-xs">Linked contact id</div>
          <CopyText value={contactId} className="max-w-fit">
            <span className="font-mono text-sm">{contactId}</span>
          </CopyText>
        </div>

        <ContactMarketingTagsManager
          organizationId={organizationId ?? null}
          contactId={contactId}
          canEdit={true}
          variant="embedded"
        />
      </CardContent>
    </Card>
  );
}
