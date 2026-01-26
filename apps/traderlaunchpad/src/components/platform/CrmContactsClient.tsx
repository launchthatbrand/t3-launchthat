"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";

import { ContactsTable } from "launchthat-plugin-crm/frontend";
import { api } from "@convex-config/_generated/api";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";
import { toast } from "@acme/ui";

export const CrmContactsClient = () => {
  const coverage = useQuery(api.platform.crm.getContactCoverage, {
    limit: 5000,
  }) as
    | { totalUsers: number; usersWithContacts: number; isTruncated: boolean }
    | undefined;
  const importMissing = useMutation(api.platform.crm.importMissingContacts);
  const [importing, setImporting] = React.useState(false);

  const totalUsers = coverage?.totalUsers ?? 0;
  const usersWithContacts = coverage?.usersWithContacts ?? 0;
  const hasMissing = totalUsers > 0 && usersWithContacts < totalUsers;
  const progress =
    totalUsers > 0 ? Math.round((usersWithContacts / totalUsers) * 100) : 0;

  const handleImport = async () => {
    if (importing) return;
    setImporting(true);
    try {
      const result = await importMissing({ limit: 5000 });
      const imported = typeof result?.imported === "number" ? result.imported : 0;
      toast.success(imported > 0 ? `Imported ${imported} contacts.` : "No missing contacts.");
    } catch {
      toast.error("Failed to import contacts.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {hasMissing ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <div>
                {usersWithContacts.toLocaleString()} / {totalUsers.toLocaleString()} users
                have a contact record.
                {coverage?.isTruncated ? " (capped)" : ""}
              </div>
              <Button
                type="button"
                className="bg-orange-600 text-white hover:bg-orange-700"
                onClick={() => void handleImport()}
                disabled={importing}
              >
                Import missing contacts
              </Button>
            </div>
            <Progress value={progress} />
          </CardContent>
        </Card>
      ) : null}

      <ContactsTable
        listContactsQuery={api.platform.crm.listContacts}
        detailHrefBase="/platform/crm/contacts"
        createHref="/platform/crm/contacts/new"
      />
    </div>
  );
};
