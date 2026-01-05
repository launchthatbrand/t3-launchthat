import { applyFilters } from "@acme/admin-runtime/hooks";

import { FRONTEND_IDENTITY_RESOLVERS_FILTER } from "~/lib/plugins/hookSlots";

export type IdentityResolveInput = {
  organizationId: string | null;
  enabledPluginIds: string[];
  userId?: string | null;
  email?: string | null;
  name?: string | null;
};

export type IdentityResolveResult = {
  contactId?: string;
  contactEmail?: string;
  contactName?: string;
};

export type IdentityResolver = {
  id: string;
  pluginId?: string;
  priority?: number;
  resolve: (
    args: IdentityResolveInput,
  ) => Promise<IdentityResolveResult | null> | IdentityResolveResult | null;
};

const isResolverEnabled = (
  resolver: IdentityResolver,
  enabledPluginIds: string[],
): boolean => {
  if (!resolver.pluginId) return true;
  return enabledPluginIds.includes(resolver.pluginId);
};

export async function resolveIdentityToContact(
  input: IdentityResolveInput,
): Promise<IdentityResolveResult | null> {
  const raw = applyFilters(FRONTEND_IDENTITY_RESOLVERS_FILTER, [], {
    organizationId: input.organizationId,
    enabledPluginIds: input.enabledPluginIds,
  });
  const resolvers: IdentityResolver[] = Array.isArray(raw)
    ? (raw as IdentityResolver[])
    : [];

  const sorted = [...resolvers].sort(
    (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
  );

  for (const resolver of sorted) {
    if (!isResolverEnabled(resolver, input.enabledPluginIds)) continue;
    const result = await resolver.resolve(input);
    if (result) return result;
  }

  return null;
}








