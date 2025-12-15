import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

export const organizationMatches = (
  recordOrg: string | undefined,
  requestedOrg?: string,
) => {
  const normalizedRequested = requestedOrg ?? undefined;
  return (recordOrg ?? undefined) === normalizedRequested;
};

// Legacy helper no longer used now that support email settings live in options.
// Kept as a stub to avoid import breakage.
export async function getEmailSettingsByAliasHelper(
  _ctx: QueryCtx,
  _aliasLocalPart: string,
): Promise<null> {
  return null;
}

const DEFAULT_EMAIL_DOMAIN =
  process.env.SUPPORT_EMAIL_DOMAIN ?? "support.launchthat.dev";

const sanitizeOrganizationId = (organizationId: string) =>
  organizationId.replace(/[^a-z0-9]/gi, "").toLowerCase();

const randomSuffix = (length: number) => {
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 36)
      .toString(36)
      .charAt(0),
  ).join("");
};

export const generateDefaultAliasParts = (organizationId: string) => {
  const base = sanitizeOrganizationId(organizationId);
  const suffix = randomSuffix(8);
  const localPart = `${base}${suffix}`;
  const address = `${localPart}@${DEFAULT_EMAIL_DOMAIN}`;
  return { localPart, address };
};
