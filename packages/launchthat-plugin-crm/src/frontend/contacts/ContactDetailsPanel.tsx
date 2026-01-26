"use client";

import * as React from "react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { ContactMetaRow, ContactRow } from "../types";

type ContactDetailsPanelProps = {
  contact: ContactRow | null | undefined;
  meta: ContactMetaRow[] | undefined;
};

const getMetaValue = (meta: ContactMetaRow[] | undefined, key: string) => {
  const row = Array.isArray(meta) ? meta.find((m) => m.key === key) : undefined;
  if (!row) return "";
  return typeof row.value === "string" ? row.value : String(row.value ?? "");
};

export const ContactDetailsPanel = ({ contact, meta }: ContactDetailsPanelProps) => {
  if (!contact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Select a contact to see details.
        </CardContent>
      </Card>
    );
  }

  const firstName = getMetaValue(meta, "contact.firstName");
  const lastName = getMetaValue(meta, "contact.lastName");
  const email = getMetaValue(meta, "contact.email");
  const phone = getMetaValue(meta, "contact.phone");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="text-muted-foreground text-xs uppercase">Name</div>
          <div className="text-foreground font-medium">
            {firstName || lastName ? `${firstName} ${lastName}`.trim() : contact.title}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs uppercase">Email</div>
          <div className="text-foreground">{email || "—"}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs uppercase">Phone</div>
          <div className="text-foreground">{phone || "—"}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs uppercase">Status</div>
          <Badge variant="outline">{contact.status || "active"}</Badge>
        </div>
        <div>
          <div className="text-muted-foreground text-xs uppercase">Tags</div>
          <div className="flex flex-wrap gap-1">
            {(contact.tags ?? []).length === 0 ? (
              <span className="text-muted-foreground text-xs">—</span>
            ) : (
              (contact.tags ?? []).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
