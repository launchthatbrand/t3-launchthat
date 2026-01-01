import { registerMetaBoxHook } from "@acme/admin-runtime";

import { SeoTab } from "../SeoTab";
import type { AdminMetaBoxContext } from "../types";

export const registerSeoMetaBox = () => {
  registerMetaBoxHook<AdminMetaBoxContext>("tab:seo", (_context) => {
    return {
      id: "core-seo",
      title: "SEO",
      description:
        "Control search snippets, Open Graph, and indexing behavior for this page.",
      location: "tab:seo",
      priority: 5,
      render: (ctx) => {
        return <SeoTab context={ctx} post={null} />;
      },
    };
  });
};


