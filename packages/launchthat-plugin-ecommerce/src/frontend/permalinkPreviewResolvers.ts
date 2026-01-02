import type { PermalinkPreviewContext } from "@acme/admin-runtime/permalinks";
import { registerPermalinkPreviewResolver } from "@acme/admin-runtime/permalinks";

let registered = false;

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const asBoolean = (value: unknown): boolean => {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return false;
};

const resolveFunnelStepPreviewPath = (
  ctx: PermalinkPreviewContext,
): string | null => {
  const stepSlug = ctx.slugValue.trim();
  if (!stepSlug) return null;

  const funnelSlug = asString(ctx.postMetaMap["step.funnelSlug"]).trim();
  const isDefaultFunnel = asBoolean(ctx.postMetaMap["step.isDefaultFunnel"]);

  if (isDefaultFunnel) {
    return stepSlug === "checkout"
      ? "/checkout/"
      : `/checkout/${encodeURIComponent(stepSlug)}/`;
  }

  if (!funnelSlug) return null;
  return `/f/${encodeURIComponent(funnelSlug)}/${encodeURIComponent(stepSlug)}/`;
};

export const registerEcommercePermalinkPreviewResolvers = (): void => {
  if (registered) return;
  registerPermalinkPreviewResolver(
    "funnel_steps",
    resolveFunnelStepPreviewPath,
  );
  registered = true;
};
