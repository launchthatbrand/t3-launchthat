"use client";

import { SupportChatWidget as PluginSupportChatWidget } from "launchthat-plugin-support";

import { useTenant } from "~/context/TenantContext";

export function SupportChatWidget() {
  const tenant = useTenant();
  return (
    <PluginSupportChatWidget
      organizationId={tenant?._id}
      tenantName={tenant?.name ?? "your organization"}
    />
  );
}
