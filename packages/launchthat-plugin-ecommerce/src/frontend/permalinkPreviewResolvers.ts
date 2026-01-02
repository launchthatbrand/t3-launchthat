import type { PermalinkPreviewContext } from "@acme/admin-runtime/permalinks";
import { registerPermalinkPreviewResolver } from "@acme/admin-runtime/permalinks";

import {
  STEP_FUNNEL_SLUG_KEY,
  STEP_IS_DEFAULT_FUNNEL_KEY,
} from "../shared/funnels/routingMeta";

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

  const funnelSlug = asString(ctx.postMetaMap[STEP_FUNNEL_SLUG_KEY]).trim();
  const isDefaultFunnel = asBoolean(
    ctx.postMetaMap[STEP_IS_DEFAULT_FUNNEL_KEY],
  );

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
