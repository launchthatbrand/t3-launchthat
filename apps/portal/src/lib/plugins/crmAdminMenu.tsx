"use client";

import type { MenuItemInput } from "~/lib/adminMenu";
import { adminMenuRegistry } from "~/lib/adminMenu";

export function registerCrmMarketingTagsMenuItem() {
  const g = globalThis as unknown as {
    __portal_crm_marketing_tags_menu_registered?: boolean;
  };
  if (g.__portal_crm_marketing_tags_menu_registered) return;
  g.__portal_crm_marketing_tags_menu_registered = true;

  adminMenuRegistry.registerSource("crm:marketingTags", (context) => {
    const isEnabled = context.isPluginEnabled ?? (() => true);
    if (!isEnabled("crm")) return [];

    const items: MenuItemInput[] = [
      {
        id: "crm:marketingTags",
        label: "Marketing Tags",
        href: "/admin/settings/marketing-tags",
        icon: "Tag",
        order: 20,
        parentId: "plugin:crm",
        section: { id: "crm", label: "CRM", order: 25 },
      },
    ];

    return items;
  });
}


