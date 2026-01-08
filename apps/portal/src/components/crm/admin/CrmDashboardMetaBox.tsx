"use client";

import React from "react";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";

interface Props {
  organizationId: string;
}

const asCount = (value: unknown): number => (Array.isArray(value) ? value.length : 0);

export const CrmDashboardMetaBox = ({ organizationId }: Props) => {
  // The CRM wrappers currently return `any`; keep the query references isolated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const apiAny = api as any;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const listMarketingTagsQuery = apiAny.plugins.crm.marketingTags.queries.listMarketingTags;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const listContactsQuery = apiAny.plugins.crm.contacts.queries.listContacts;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const tags = useQuery(listMarketingTagsQuery, {
    organizationId,
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const contacts = useQuery(listContactsQuery, {
    organizationId,
    limit: 50,
  });

  const tagCount = asCount(tags);
  const contactCount = asCount(contacts);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-sm font-medium">Marketing tags</div>
            <div className="text-2xl font-semibold">{tagCount}</div>
            <div className="text-muted-foreground text-xs">
              Organization-scoped tag catalog
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-sm font-medium">Contacts</div>
            <div className="text-2xl font-semibold">{contactCount}</div>
            <div className="text-muted-foreground text-xs">
              Showing recent up to 50
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/settings/marketing-tags">Manage marketing tags</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/tags">View tagged users</Link>
        </Button>
      </div>
    </div>
  );
};


