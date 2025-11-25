import { internal } from "@convex-config/_generated/api";

import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { httpAction } from "../../_generated/server";
import { getEmailSettingsByAliasHelper } from "./helpers";

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

  console.log("aliasLocalPart", aliasLocalPart);

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
    const match = fromField.match(/^(.*)<(.+)>$/);
    if (match) {
      contactName = match[1].trim() || undefined;
      contactEmail = match[2].trim();
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
  const textBody =
    payload?.data?.text ?? payload?.text ?? payload?.data?.html ?? "";

  await ctx.runMutation(
    internal.plugins.support.mutations.recordMessageInternal,
    {
      organizationId,
      sessionId,
      role: "user",
      content: textBody || "(empty email body)",
      contactEmail,
      contactName,
      messageType: "email_inbound",
      subject,
    },
  );

  return new Response("ok", { status: 200, headers: corsHeaders });
});
