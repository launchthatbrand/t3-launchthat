import type { RegisteredMetaBox } from "@acme/admin-runtime";
import { registerMetaBoxHook } from "@acme/admin-runtime";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import type { AdminMetaBoxContext } from "../types";
import {
  DEFAULT_PAGE_TEMPLATE_SLUG,
  listPageTemplates,
} from "~/lib/pageTemplates/registry";

const PageTemplateMetaBox = ({ context }: { context: AdminMetaBoxContext }) => {
  const organizationId =
    typeof context.organizationId === "string"
      ? context.organizationId
      : context.organizationId
        ? String(context.organizationId)
        : undefined;
  const templates = listPageTemplates(organizationId);

  const postTypeDefaultSlug =
    context.postType &&
    typeof (context.postType as { pageTemplateSlug?: unknown }).pageTemplateSlug ===
      "string"
      ? ((context.postType as { pageTemplateSlug: string }).pageTemplateSlug ??
        DEFAULT_PAGE_TEMPLATE_SLUG)
      : DEFAULT_PAGE_TEMPLATE_SLUG;

  const currentOverrideRaw = context.getMetaValue
    ? context.getMetaValue("page_template")
    : (context.customFields?.postMetaMap.page_template ?? undefined);
  const currentOverride =
    typeof currentOverrideRaw === "string" ? currentOverrideRaw : undefined;

  const effectiveSlug = currentOverride?.trim()
    ? currentOverride.trim()
    : postTypeDefaultSlug;

  const effectiveLabel =
    templates.find((t) => t.slug === effectiveSlug)?.label ?? effectiveSlug;
  const defaultLabel =
    templates.find((t) => t.slug === postTypeDefaultSlug)?.label ??
    postTypeDefaultSlug;

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs">Template</p>
        <Select
          value={effectiveSlug}
          onValueChange={(next) => {
            if (!context.setMetaValue) return;
            // Selecting the post type default clears the per-post override.
            if (next === postTypeDefaultSlug) {
              context.setMetaValue("page_template", "");
              return;
            }
            context.setMetaValue("page_template", next);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.slug} value={template.slug}>
                {template.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-muted-foreground text-xs">
        Default for this post type:{" "}
        <span className="font-medium">{defaultLabel}</span>
      </p>

      <p className="text-muted-foreground text-xs">
        Current: <span className="font-medium">{effectiveLabel}</span>
      </p>
      <p className="text-muted-foreground text-xs">
        This selection overrides the post type default for this post only.
      </p>
    </div>
  );
};

export const registerPageTemplateMetaBox: () => void = () => {
  registerMetaBoxHook<AdminMetaBoxContext>(
    "sidebar",
    (context): RegisteredMetaBox<AdminMetaBoxContext> | null => {
      if (context.visibility?.showSidebarPageTemplate === false) {
        return null;
      }

      return {
        id: "core-page-template",
        title: "Page Template",
        description: "Default is configured in Post Type settings; this can override per post.",
        location: "sidebar",
        priority: 15,
        render: () => <PageTemplateMetaBox context={context} />,
      };
    },
  );
};


