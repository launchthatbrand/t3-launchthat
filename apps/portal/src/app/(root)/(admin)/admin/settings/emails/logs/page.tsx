"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Eye } from "lucide-react";

import type { ColumnDefinition } from "@acme/ui/entity-list";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@acme/ui/dialog";
import { EntityList } from "@acme/ui/entity-list";
import { Textarea } from "@acme/ui/textarea";

import { useTenant } from "~/context/TenantContext";

interface EmailOutboxRow {
  _id: Id<"emailOutbox">;
  createdAt: number;
  sentAt?: number | null;
  status: "queued" | "sent" | "failed";
  to: string;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | null;
  subject: string;
  templateKey?: string | null;
  providerMessageId?: string | null;
  error?: string | null;
  htmlBody: string;
  textBody: string;
}

interface EmailOutboxPage {
  page: EmailOutboxRow[];
  isDone: boolean;
  continueCursor: string | null;
}

interface EmailLogRow extends Record<string, unknown> {
  _id: string;
  createdAt: number;
  sentAt?: number;
  status: "queued" | "sent" | "failed";
  to: string;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string;
  subject: string;
  templateKey?: string;
  providerMessageId?: string;
  error?: string;
  htmlBody: string;
  textBody: string;
}

const STATUS_BADGE_VARIANT: Record<
  EmailLogRow["status"],
  "default" | "secondary" | "destructive"
> = {
  queued: "secondary",
  sent: "default",
  failed: "destructive",
};

export default function AdminEmailLogsPage() {
  const tenant = useTenant();
  const orgId: Id<"organizations"> | undefined = tenant?._id;

  const outbox = useQuery(
    api.core.emails.service.listOutbox,
    orgId
      ? {
          orgId,
          paginationOpts: { numItems: 100, cursor: null },
        }
      : "skip",
  ) as EmailOutboxPage | undefined;

  const [selectedOutboxRow, setSelectedOutboxRow] =
    useState<EmailLogRow | null>(null);

  const logRows = useMemo<EmailLogRow[]>(() => {
    if (!outbox) return [];
    return outbox.page.map((row) => ({
      _id: String(row._id),
      createdAt: row.createdAt,
      sentAt: row.sentAt ?? undefined,
      status: row.status,
      to: row.to,
      fromName: row.fromName,
      fromEmail: row.fromEmail,
      replyToEmail: row.replyToEmail ?? undefined,
      subject: row.subject,
      templateKey: row.templateKey ?? undefined,
      providerMessageId: row.providerMessageId ?? undefined,
      error: row.error ?? undefined,
      htmlBody: row.htmlBody,
      textBody: row.textBody,
    }));
  }, [outbox]);

  const logColumns = useMemo<ColumnDefinition<EmailLogRow>[]>(
    () => [
      {
        id: "createdAt",
        header: "Created",
        accessorKey: "createdAt",
        cell: (item: EmailLogRow) => (
          <div className="text-sm">
            <div className="font-medium">
              {new Date(item.createdAt).toLocaleString()}
            </div>
            {item.sentAt ? (
              <div className="text-muted-foreground">
                Sent {new Date(item.sentAt).toLocaleString()}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (item: EmailLogRow) => (
          <Badge variant={STATUS_BADGE_VARIANT[item.status]}>
            {item.status}
          </Badge>
        ),
      },
      {
        id: "to",
        header: "To",
        accessorKey: "to",
        cell: (item: EmailLogRow) => (
          <div className="max-w-[280px] truncate font-mono text-sm">
            {item.to}
          </div>
        ),
      },
      {
        id: "fromEmail",
        header: "From",
        accessorKey: "fromEmail",
        cell: (item: EmailLogRow) => (
          <div className="max-w-[280px] truncate font-mono text-sm">
            {item.fromEmail}
          </div>
        ),
      },
      {
        id: "subject",
        header: "Subject",
        accessorKey: "subject",
        cell: (item: EmailLogRow) => (
          <div className="max-w-[460px] truncate font-medium">
            {item.subject}
          </div>
        ),
      },
      {
        id: "templateKey",
        header: "Template",
        accessorKey: "templateKey",
        cell: (item: EmailLogRow) => (
          <div className="text-muted-foreground max-w-60 truncate font-mono text-sm">
            {item.templateKey ?? "—"}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (item: EmailLogRow) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="View email details"
              onClick={() => setSelectedOutboxRow(item)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <EntityList
        data={logRows}
        columns={logColumns}
        title="Email log"
        description="All transactional emails queued/sent/failed for this organization."
        isLoading={outbox === undefined}
        emptyState={<div className="text-muted-foreground">No emails yet.</div>}
      />

      <Dialog
        open={Boolean(selectedOutboxRow)}
        onOpenChange={(open) => {
          if (!open) setSelectedOutboxRow(null);
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogTitle>Email details</DialogTitle>
          {!selectedOutboxRow ? null : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Outbox ID</div>
                    <div className="font-mono">{selectedOutboxRow._id}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <Badge variant={STATUS_BADGE_VARIANT[selectedOutboxRow.status]}>
                      {selectedOutboxRow.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Created</div>
                    <div>
                      {new Date(selectedOutboxRow.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {selectedOutboxRow.sentAt ? (
                    <div>
                      <div className="text-muted-foreground">Sent</div>
                      <div>
                        {new Date(selectedOutboxRow.sentAt).toLocaleString()}
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <div className="text-muted-foreground">From</div>
                    <div className="font-mono">
                      {selectedOutboxRow.fromName} {"<"}
                      {selectedOutboxRow.fromEmail}
                      {">"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">To</div>
                    <div className="font-mono">{selectedOutboxRow.to}</div>
                  </div>
                  {selectedOutboxRow.replyToEmail ? (
                    <div>
                      <div className="text-muted-foreground">Reply-To</div>
                      <div className="font-mono">{selectedOutboxRow.replyToEmail}</div>
                    </div>
                  ) : null}
                  <div>
                    <div className="text-muted-foreground">Subject</div>
                    <div className="font-medium">{selectedOutboxRow.subject}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Template</div>
                    <div className="font-mono">{selectedOutboxRow.templateKey ?? "—"}</div>
                  </div>
                  {selectedOutboxRow.providerMessageId ? (
                    <div>
                      <div className="text-muted-foreground">Provider message ID</div>
                      <div className="font-mono">{selectedOutboxRow.providerMessageId}</div>
                    </div>
                  ) : null}
                  {selectedOutboxRow.error ? (
                    <div>
                      <div className="text-muted-foreground">Error</div>
                      <div className="text-destructive">{selectedOutboxRow.error}</div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">HTML preview</div>
                  <iframe
                    title="Email HTML preview"
                    className="h-[420px] w-full rounded-md border bg-white"
                    srcDoc={selectedOutboxRow.htmlBody}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Text body</div>
                <Textarea
                  value={selectedOutboxRow.textBody}
                  readOnly
                  className="min-h-[200px] font-mono"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


