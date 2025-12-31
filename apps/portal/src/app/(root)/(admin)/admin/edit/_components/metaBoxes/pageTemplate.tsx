import type { RegisteredMetaBox } from "@acme/admin-runtime";
import { registerMetaBoxHook } from "@acme/admin-runtime";

import type { AdminMetaBoxContext } from "../types";

const PageTemplateMetaBox = ({ context }: { context: AdminMetaBoxContext }) => {
  const label =
    typeof (context as any).pageTemplateLabel === "string"
      ? ((context as any).pageTemplateLabel as string)
      : null;

  if (!label) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm">{label}</p>
      <p className="text-muted-foreground text-xs">
        This is configured per post type (no per-post override).
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

      const label =
        typeof (context as any).pageTemplateLabel === "string"
          ? ((context as any).pageTemplateLabel as string)
          : null;
      if (!label) {
        return null;
      }

      return {
        id: "core-page-template",
        title: "Page Template",
        description: "Post type-level template selection.",
        location: "sidebar",
        priority: 15,
        render: () => <PageTemplateMetaBox context={context} />,
      };
    },
  );
};


