"use client";

import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useAction, useMutation, useQuery } from "convex/react";
import { Mail, RefreshCcw, SendHorizonal } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui/toast";

type TemplateRow = {
  id: string;
  title: string;
  status: "published" | "draft" | "archived";
  pdfUrl: string | null;
};

const apiAny = api as any;

const EMAIL_REGEX =
  // intentionally simple; we just need to prevent obvious mistakes
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const metaRowsToRecord = (
  rows: Array<{ key?: string; value?: unknown }>,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const row of rows) {
    const key = typeof row?.key === "string" ? row.key : "";
    if (!key) continue;
    out[key] = row?.value ?? null;
  }
  return out;
};

export const DisclaimersIssueSendMetaBox = ({
  context,
}: PluginMetaBoxRendererProps) => {
  const router = useRouter();
  const postId = context.postId;
  const organizationId = context.organizationId;
  const orgId = organizationId ? String(organizationId) : undefined;

  const postMetaRows = useQuery(
    apiAny.plugins.disclaimers.posts.queries.getPostMeta,
    postId
      ? {
          postId,
          organizationId: orgId,
        }
      : "skip",
  ) as Array<{ key?: string; value?: unknown }> | undefined;

  const meta = useMemo(
    () => metaRowsToRecord(postMetaRows ?? []),
    [postMetaRows],
  );

  const existingIssueId =
    typeof meta["disclaimer.issueId"] === "string"
      ? String(meta["disclaimer.issueId"])
      : null;
  const existingTemplatePostId =
    typeof meta["disclaimer.templatePostId"] === "string"
      ? String(meta["disclaimer.templatePostId"])
      : "";
  const existingRecipientEmail =
    typeof meta["disclaimer.recipientEmail"] === "string"
      ? String(meta["disclaimer.recipientEmail"])
      : "";
  const existingRecipientName =
    typeof meta["disclaimer.recipientName"] === "string"
      ? String(meta["disclaimer.recipientName"])
      : "";
  const issueStatus =
    typeof meta["disclaimer.issueStatus"] === "string"
      ? String(meta["disclaimer.issueStatus"])
      : "";
  const storedSignUrl =
    typeof meta["disclaimer.signUrl"] === "string"
      ? String(meta["disclaimer.signUrl"])
      : "";

  const templates = useQuery(
    apiAny.plugins.disclaimers.queries.listDisclaimerTemplates,
    {
      organizationId: orgId,
    },
  ) as TemplateRow[] | undefined;

  const templateOptions = useMemo(() => {
    const rows = templates ?? [];
    return rows
      .filter((t) => t.status !== "archived")
      .map((t) => ({
        id: t.id,
        label: t.title,
        pdfUrl: t.pdfUrl,
        status: t.status,
      }));
  }, [templates]);

  const selectedTemplate = useMemo(() => {
    const id = existingTemplatePostId;
    return templateOptions.find((t) => t.id === id) ?? null;
  }, [existingTemplatePostId, templateOptions]);

  const [templatePostId, setTemplatePostId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [signUrl, setSignUrl] = useState<string>("");

  useEffect(() => {
    setTemplatePostId(existingTemplatePostId);
    setRecipientName(existingRecipientName);
    setRecipientEmail(existingRecipientEmail);
  }, [existingRecipientEmail, existingRecipientName, existingTemplatePostId]);

  useEffect(() => {
    setSignUrl(storedSignUrl);
  }, [storedSignUrl]);

  const issueAndSend = useAction(
    apiAny.plugins.disclaimers.actions.issueDisclaimerAndSendEmail,
  ) as (args: {
    orgId?: string;
    issuePostId?: string;
    templatePostId: string;
    recipientEmail: string;
    recipientName?: string;
    clientOrigin?: string;
  }) => Promise<{ issueId: string; signUrl: string }>;

  const resend = useAction(
    apiAny.plugins.disclaimers.actions.resendDisclaimerAndSendEmail,
  ) as (args: {
    orgId?: string;
    issueId: string;
    clientOrigin?: string;
  }) => Promise<{
    issueId: string;
    signUrl: string;
  }>;

  const updateDisclaimerPost = useMutation(
    apiAny.plugins.disclaimers.posts.mutations.updatePost,
  ) as (args: {
    id: string;
    meta?: Record<string, string | number | boolean | null>;
  }) => Promise<string>;

  const [isPending, startTransition] = useTransition();

  const handleSend = useCallback(() => {
    if (!postId) {
      toast.error("Save this disclaimer post first.");
      return;
    }
    if (!orgId) {
      toast.error("Missing organization context.");
      return;
    }

    const email = recipientEmail.trim().toLowerCase();
    if (!templatePostId) {
      toast.error("Select a template.");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      toast.error("Enter a valid recipient email.");
      return;
    }

    startTransition(() => {
      void issueAndSend({
        orgId,
        issuePostId: postId,
        templatePostId,
        recipientEmail: email,
        recipientName: recipientName.trim() ? recipientName.trim() : undefined,
        clientOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
      })
        .then((result) => {
          setSignUrl(result.signUrl);
          // Persist so the link is visible in the metabox after refresh.
          void updateDisclaimerPost({
            id: postId,
            meta: {
              "disclaimer.signUrl": result.signUrl,
            },
          });
          toast.success("Disclaimer email sent", {
            description: result.signUrl,
          });
          // The send flow mutates the post status server-side; refresh so the
          // sidebar status picker updates immediately.
          router.refresh();
        })
        .catch((error: unknown) => {
          toast.error("Failed to send disclaimer", {
            description:
              error instanceof Error ? error.message : "Unexpected error",
          });
        });
    });
  }, [
    issueAndSend,
    orgId,
    postId,
    recipientEmail,
    recipientName,
    startTransition,
    templatePostId,
  ]);

  const handleResend = useCallback(() => {
    if (!postId) {
      toast.error("Save this disclaimer post first.");
      return;
    }
    if (!existingIssueId) return;
    startTransition(() => {
      void resend({
        orgId,
        issueId: existingIssueId,
        clientOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
      })
        .then((result) => {
          setSignUrl(result.signUrl);
          void updateDisclaimerPost({
            id: postId,
            meta: {
              "disclaimer.signUrl": result.signUrl,
            },
          });
          toast.success("Disclaimer email resent", {
            description: result.signUrl,
          });
          router.refresh();
        })
        .catch((error: unknown) => {
          toast.error("Failed to resend disclaimer", {
            description:
              error instanceof Error ? error.message : "Unexpected error",
          });
        });
    });
  }, [existingIssueId, orgId, postId, resend, startTransition, updateDisclaimerPost]);

  return (
    <div className="space-y-4">
      {issueStatus ? (
        <div className="flex items-center justify-between gap-2">
          <div className="text-muted-foreground text-xs">Issue status</div>
          <Badge variant="outline" className="capitalize">
            {issueStatus}
          </Badge>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>Template</Label>
        <Select value={templatePostId} onValueChange={setTemplatePostId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templateOptions.length === 0 ? (
              <SelectItem value="__none__" disabled>
                No templates found
              </SelectItem>
            ) : null}
            {templateOptions.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
                {t.status === "draft" ? " (draft)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTemplate?.pdfUrl ? (
          <div className="text-xs">
            <Link
              href={selectedTemplate.pdfUrl}
              target="_blank"
              className="text-primary underline underline-offset-4"
            >
              View template PDF
            </Link>
          </div>
        ) : (
          <div className="text-muted-foreground text-xs">
            {templatePostId
              ? "This template has no PDF yet. Upload one in the template editor."
              : "Select a template to continue."}
          </div>
        )}
      </div>

      <div className="grid gap-3">
        <div className="space-y-2">
          <Label htmlFor="disclaimer-recipient-name">Recipient name</Label>
          <Input
            id="disclaimer-recipient-name"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="disclaimer-recipient-email">Recipient email</Label>
          <Input
            id="disclaimer-recipient-email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="jane@example.com"
            inputMode="email"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {existingIssueId ? (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleResend}
              disabled={isPending}
            >
              <RefreshCcw className="h-4 w-4" />
              Resend email
            </Button>

            {signUrl ? (
              <div className="text-xs">
                <div className="text-muted-foreground mb-1">Signing link</div>
                <Link
                  href={signUrl}
                  target="_blank"
                  className="text-primary break-all underline underline-offset-4"
                >
                  {signUrl}
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <Button
          type="button"
          size="sm"
          className="gap-2"
          onClick={handleSend}
          disabled={isPending}
        >
          <SendHorizonal className="h-4 w-4" />
          {existingIssueId ? "Send again" : "Send disclaimer"}
        </Button>

        {existingIssueId ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            disabled
          >
            <Mail className="h-4 w-4" />
            Issue ID set
          </Button>
        ) : null}
      </div>
    </div>
  );
};
