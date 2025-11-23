import type { PluginDefinition } from "launchthat-plugin-core";

export const calendarPlugin: PluginDefinition = {
  id: "calendar",
  name: "Campaign Calendar",
  description: "Shared calendars and event planning tools.",
  longDescription:
    "Orchestrate launches and content campaigns across teams. Enabling this plugin provisions collaborative calendars plus rich event records with scheduling metadata.",
  features: [
    "Team and organization calendars",
    "Drag-and-drop scheduling",
    "Color-coded ownership",
    "Recurring events with reminders",
  ],
  postTypes: [
    {
      name: "Calendars",
      slug: "calendars",
      description: "Shared calendars for launches, editorial plans, or teams.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        title: true,
        customFields: true,
        postMeta: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "calendar",
      },
      adminMenu: {
        enabled: true,
        label: "Calendars",
        slug: "calendar",
        icon: "CalendarDays",
        position: 20,
        parent: "calendar",
      },
    },
    {
      name: "Events",
      slug: "events",
      description: "Calendar events with descriptions, timing and ownership.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        title: true,
        editor: true,
        excerpt: true,
        featuredImage: true,
        customFields: true,
        postMeta: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "event",
      },
      adminMenu: {
        enabled: true,
        label: "Events",
        slug: "calendar/events",
        icon: "CalendarPlus",
        position: 21,
        parent: "calendar",
      },
    },
  ],
};

export default calendarPlugin;

