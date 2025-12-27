"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useMemo, useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useAction, useQuery } from "convex/react";

import { toast } from "@acme/ui/toast";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

type TemplateRow = {
  id: string;
  title: string;
};

type IssueRow = {
  id: string;
  status: "incomplete" | "complete";
  recipientEmail: string;
  recipientName?: string | null;
  recipientUserId?: string | null;
  templatePostId: string;
  sendCount: number;
  lastSentAt?: number | null;
  createdAt: number;
  completedAt?: number | null;
};

const apiAny = api as any;

const formatDateTime = (ts?: number | null) => {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
};

export const DisclaimersIssuedPage = (props: PluginSettingComponentProps) => {
  const orgId = props.organizationId ? String(props.organizationId) : undefined;

  const templatesRaw = useQuery(apiAny.plugins.disclaimers.queries.listDisclaimerTemplates, {
    organizationId: orgId,
  }) as { id: string; title: string }[] | undefined;

  const templates: TemplateRow[] = useMemo(
    () => (templatesRaw ?? []).map((t) => ({ id: t.id, title: t.title })),
    [templatesRaw],
  );

  const [activeStatus, setActiveStatus] = useState<"incomplete" | "complete">(
    "incomplete",
  );

  const issues = useQuery(apiAny.plugins.disclaimers.queries.listIssues, {
    organizationId: orgId,
    status: activeStatus,
    limit: 200,
  }) as IssueRow[] | undefined;

  const issueAndSend = useAction(
    apiAny.plugins.disclaimers.actions.issueDisclaimerAndSendEmail,
  ) as (args: {
    orgId?: string;
    templatePostId: string;
    recipientEmail: string;
    recipientName?: string;
    recipientUserId?: string;
  }) => Promise<{ issueId: string; signUrl: string }>;

  const resendAndSend = useAction(
    apiAny.plugins.disclaimers.actions.resendDisclaimerAndSendEmail,
  ) as (args: {
    orgId?: string;
    issueId: string;
  }) => Promise<{ issueId: string; signUrl: string }>;

  const [createOpen, setCreateOpen] = useState(false);
  const [viewIssueId, setViewIssueId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");

  const [isPending, startTransition] = useTransition();

  const templateTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    templates.forEach((t) => {
      map[t.id] = t.title;
    });
    return map;
  }, [templates]);

  const columns: ColumnDefinition<IssueRow>[] = useMemo(
    () => [
      {
        id: "recipient",
        header: "Recipient",
        accessorKey: "recipientEmail",
        cell: (r: IssueRow) => {
          return (
            <div className="space-y-0.5">
              <div className="font-medium">{r.recipientEmail}</div>
              {r.recipientName ? (
                <div className="text-muted-foreground text-xs">{r.recipientName}</div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "template",
        header: "Template",
        accessorKey: "templatePostId",
        cell: (item: IssueRow) => (
          <div className="text-sm">
            {templateTitleById[item.templatePostId] ?? item.templatePostId}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (item: IssueRow) => <div className="capitalize">{item.status}</div>,
      },
      {
        id: "sent",
        header: "Sent",
        accessorKey: "sendCount",
        cell: (item: IssueRow) => (
          <div className="text-sm">
            {item.sendCount}{" "}
            <span className="text-muted-foreground">
              {item.lastSentAt ? `(${formatDateTime(item.lastSentAt)})` : ""}
            </span>
          </div>
        ),
      },
      {
        id: "completed",
        header: "Completed",
        accessorKey: "completedAt",
        cell: (item: IssueRow) => (
          <div className="text-muted-foreground text-sm">
            {formatDateTime(item.completedAt)}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (issue: IssueRow) => {

          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setViewIssueId(issue.id);
                  setViewOpen(true);
                }}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  startTransition(() => {
                    void resendAndSend({
                      orgId,
                      issueId: issue.id,
                    })
                      .then((res) => {
                        toast.success("Resent");
                        // handy for admins to copy/share
                        void navigator.clipboard?.writeText(res.signUrl).catch(() => {});
                      })
                      .catch((err: unknown) => {
                        toast.error(
                          err instanceof Error ? err.message : "Failed to resend",
                        );
                      });
                  });
                }}
                disabled={isPending}
              >
                Resend
              </Button>
            </div>
          );
        },
      },
    ],
    [isPending, orgId, resendAndSend, templateTitleById],
  );

  const handleIssue = () => {
    if (!templateId) {
      toast.error("Choose a template.");
      return;
    }
    const email = recipientEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Enter recipient email.");
      return;
    }

    startTransition(() => {
      void issueAndSend({
        orgId,
        templatePostId: templateId,
        recipientEmail: email,
        recipientName: recipientName.trim() || undefined,
      })
        .then((res) => {
          toast.success("Issued");
          void navigator.clipboard?.writeText(res.signUrl).catch(() => {});
          setCreateOpen(false);
          setRecipientEmail("");
          setRecipientName("");
          setTemplateId("");
        })
        .catch((err: unknown) => {
          toast.error(err instanceof Error ? err.message : "Failed to issue");
        });
    });
  };

  return (
    <div className="space-y-4">
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Disclaimer issue</DialogTitle>
            <DialogDescription>View signing status and evidence.</DialogDescription>
          </DialogHeader>
          {viewIssueId ? (
            <IssuedIssueDetails orgId={orgId} issueId={viewIssueId} />
          ) : (
            <div className="text-muted-foreground text-sm">No issue selected.</div>
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setViewOpen(false);
                setViewIssueId(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Issued disclaimers</CardTitle>
            <CardDescription>
              Track outstanding requests and completed signatures.
            </CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>Issue disclaimer</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Issue disclaimer</DialogTitle>
                <DialogDescription>
                  Send a request to sign a disclaimer.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name (optional)</Label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleIssue} disabled={isPending}>
                  Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs value={activeStatus} onValueChange={(v) => setActiveStatus(v as any)}>
            <TabsList>
              <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
              <TabsTrigger value="complete">Complete</TabsTrigger>
            </TabsList>
            <TabsContent value="incomplete" className="mt-4">
              <EntityList
                data={issues ?? []}
                columns={columns}
                title="Issued disclaimers"
                description="Track outstanding requests and completed signatures."
                isLoading={issues === undefined}
                emptyState={
                  <div className="text-muted-foreground">No issues.</div>
                }
              />
            </TabsContent>
            <TabsContent value="complete" className="mt-4">
              <EntityList
                data={issues ?? []}
                columns={columns}
                title="Issued disclaimers"
                description="Track outstanding requests and completed signatures."
                isLoading={issues === undefined}
                emptyState={
                  <div className="text-muted-foreground">No issues.</div>
                }
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const IssuedIssueDetails = ({ orgId, issueId }: { orgId?: string; issueId: string }) => {
  const signature = useQuery(apiAny.plugins.disclaimers.queries.getLatestSignatureForIssue, {
    organizationId: orgId,
    issueId,
  }) as
    | {
        signedPdfUrl: string | null;
        pdfSha256: string;
        createdAt: number;
      }
    | null
    | undefined;

  if (signature === undefined) {
    return <div className="text-muted-foreground text-sm">Loading…</div>;
  }

  if (!signature) {
    return <div className="text-muted-foreground text-sm">No signature recorded.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="text-sm">
        <div className="font-medium">Signed at</div>
        <div className="text-muted-foreground">{formatDateTime(signature.createdAt)}</div>
      </div>
      <div className="text-sm">
        <div className="font-medium">PDF sha256</div>
        <div className="text-muted-foreground break-all">{signature.pdfSha256}</div>
      </div>
      <div className="text-sm">
        <div className="font-medium">Signed PDF</div>
        {signature.signedPdfUrl ? (
          <a className="text-primary underline" href={signature.signedPdfUrl} target="_blank" rel="noreferrer">
            Open signed PDF
          </a>
        ) : (
          <div className="text-muted-foreground">Unavailable</div>
        )}
      </div>
    </div>
  );
};


