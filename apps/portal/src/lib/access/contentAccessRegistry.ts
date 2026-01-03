import { applyFilters } from "@acme/admin-runtime/hooks";

import { FRONTEND_CONTENT_ACCESS_PROVIDERS_FILTER } from "~/lib/plugins/hookSlots";

export type ContentAccessDecision =
  | { kind: "allow"; reason?: string }
  | { kind: "deny"; reason?: string }
  | { kind: "redirect"; to: string; reason?: string }
  | { kind: "abstain" };

export interface ContentAccessSubject {
  organizationId: string | null;
  enabledPluginIds: string[];
  userId?: string | null;
  contactId?: string | null;
  isAuthenticated: boolean;
}

export interface ContentAccessResource {
  contentType: string;
  contentId: string;
  parent?: { contentType: string; contentId: string } | null;
}

export interface ContentAccessProvider {
  id: string;
  pluginId?: string;
  priority?: number;
  decide: (args: {
    subject: ContentAccessSubject;
    resource: ContentAccessResource;
    data?: unknown;
  }) => ContentAccessDecision;
}

const isProviderEnabled = (
  provider: ContentAccessProvider,
  enabledPluginIds: string[],
): boolean => {
  if (!provider.pluginId) return true;
  return enabledPluginIds.includes(provider.pluginId);
};

const isTerminalDecision = (decision: ContentAccessDecision): boolean =>
  decision.kind === "allow" ||
  decision.kind === "deny" ||
  decision.kind === "redirect";

export function evaluateContentAccess(args: {
  subject: ContentAccessSubject;
  resource: ContentAccessResource;
  data?: unknown;
}): ContentAccessDecision {
  const raw = applyFilters(FRONTEND_CONTENT_ACCESS_PROVIDERS_FILTER, [], {
    organizationId: args.subject.organizationId,
    enabledPluginIds: args.subject.enabledPluginIds,
    resource: args.resource,
  });
  const providers: ContentAccessProvider[] = Array.isArray(raw)
    ? (raw as ContentAccessProvider[])
    : [];

  const sorted = [...providers].sort(
    (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
  );

  for (const provider of sorted) {
    if (!isProviderEnabled(provider, args.subject.enabledPluginIds)) continue;
    const decision = provider.decide(args);
    if (isTerminalDecision(decision)) {
      return decision;
    }
  }

  return { kind: "abstain" };
}
