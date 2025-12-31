import type { PluginFrontendSingleRendererProps } from "launchthat-plugin-core";
import React from "react";

import { ProductSingleView } from "./ProductSingleView";

export const renderProductSingle = (
  props: PluginFrontendSingleRendererProps,
): React.ReactNode => {
  const post = props.post as any;
  const organizationId =
    post && typeof post === "object" && "organizationId" in post
      ? (post as { organizationId?: unknown }).organizationId
      : undefined;

  return (
    <ProductSingleView
      post={post}
      organizationId={
        typeof organizationId === "string" ? organizationId : undefined
      }
    />
  );
};
