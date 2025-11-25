/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { internal } from "@convex-config/_generated/api";

import type { Id } from "../../_generated/dataModel";
import { httpAction } from "../../_generated/server";

const corsHeaders = new Headers({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

export const supportEmailInbound = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const toField =
    payload?.data?.to ?? payload?.to ?? payload?.data?.envelope?.to ?? [];
  const toAddress = Array.isArray(toField) ? toField[0] : toField;
  if (typeof toAddress !== "string") {
    return new Response("Missing recipient alias", { status: 400 });
  }

  const aliasLocalPart = toAddress.split("@")[0]?.toLowerCase();
  if (!aliasLocalPart) {
    return new Response("Invalid alias format", { status: 400 });
  }

  const aliasRecord = await ctx.runQuery(
    internal.plugins.support.queries.getEmailSettingsByAlias,
    { aliasLocalPart },
  );

  if (!aliasRecord) {
    return new Response("Alias not registered", {
      status: 404,
      headers: corsHeaders,
    });
  }

  const organizationId = aliasRecord.organizationId as Id<"organizations">;
  const sessionId =
    payload?.data?.message_id ??
    payload?.data?.email_id ??
    payload?.metadata?.sessionId ??
    `${organizationId}_${Date.now()}`;

  const fromField =
    payload?.data?.from ?? payload?.from ?? payload?.data?.envelope?.from ?? "";
  let contactEmail: string | undefined;
  let contactName: string | undefined;
  if (typeof fromField === "string") {
    const match = /^(.*)<(.+)>$/.exec(fromField);
    if (match) {
      contactName = match[1]?.trim() ?? undefined;
      contactEmail = match[2]?.trim();
    } else {
      contactEmail = fromField.trim();
    }
  } else if (fromField?.address) {
    contactEmail = fromField.address;
    contactName = fromField.name ?? undefined;
  } else if (fromField?.email) {
    contactEmail = fromField.email;
    contactName = fromField.name ?? undefined;
  }

  const subject = payload?.data?.subject ?? payload?.subject ?? undefined;
  const messageId =
    payload?.data?.email_id ??
    payload?.data?.message_id ??
    payload?.metadata?.messageId;

  let textBody: string =
    payload?.data?.text ?? payload?.text ?? payload?.data?.html ?? "";
  let htmlBody: string | undefined =
    payload?.data?.html ?? payload?.html ?? undefined;

  console.log("messageId", messageId);
  console.log("process.env.RESEND_API_KEY", process.env.RESEND_API_KEY);

  if (messageId && process.env.RESEND_API_KEY) {
    try {
      const emailResponse = await fetch(
        `https://api.resend.com/emails/receiving/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (emailResponse.ok) {
        const emailData: {
          html?: string;
          text?: string;
          headers?: Record<string, string>;
        } = await emailResponse.json();
        if (emailData.text) {
          textBody = emailData.text;
        }
        if (emailData.html) {
          htmlBody = emailData.html;
        }
      } else {
        console.warn(
          "[supportEmailInbound] Failed to fetch email content from Resend",
          await emailResponse.text(),
        );
      }
    } catch (error) {
      console.error(
        "[supportEmailInbound] Error fetching email content from Resend",
        error,
      );
    }
  }

  await ctx.runMutation(
    internal.plugins.support.mutations.recordMessageInternal,
    {
      organizationId,
      sessionId,
      role: "user",
      content: textBody || htmlBody || "(empty email body)",
      contactEmail,
      contactName,
      messageType: "email_inbound",
      subject,
      emailMessageId: messageId,
      htmlBody,
      textBody: textBody || undefined,
    },
  );

  return new Response("ok", { status: 200, headers: corsHeaders });
});
