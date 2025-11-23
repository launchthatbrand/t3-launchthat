import type { PluginDefinition } from "launchthat-plugin-core";

export const helpdeskPlugin: PluginDefinition = {
  id: "helpdesk",
  name: "Helpdesk",
  description: "Tickets and threaded conversations.",
  longDescription:
    "Provide support for your customers. Adds ticket post types and sidebar entries.",
  features: [
    "Tickets + replies",
    "Priority + status fields",
    "Internal / external notes",
    "Admin navigation items",
  ],
  postTypes: [
    {
      name: "Tickets",
      slug: "tickets",
      description: "Primary helpdesk ticket entity.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        title: true,
        editor: true,
        customFields: true,
        postMeta: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "ticket",
        withFront: true,
        feeds: false,
        pages: true,
      },
      adminMenu: {
        enabled: true,
        label: "Tickets",
        slug: "helpdesk/tickets",
        icon: "LifeBuoy",
        position: 50,
      },
    },
    {
      name: "Ticket Replies",
      slug: "ticket-replies",
      description: "Threaded responses linked to a ticket.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        editor: true,
        customFields: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "ticket-reply",
        withFront: true,
        feeds: false,
        pages: true,
      },
      adminMenu: {
        enabled: false,
      },
    },
  ],
};

export default helpdeskPlugin;

