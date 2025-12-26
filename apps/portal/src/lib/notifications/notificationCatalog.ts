import type {
  NotificationEventCategory,
  PluginDefinition,
  PluginNotificationEventDefinition,
} from "launchthat-plugin-core";

import { pluginDefinitions } from "~/lib/plugins/definitions";

export interface NotificationEventCatalogItem
  extends PluginNotificationEventDefinition {
  pluginId: string;
  pluginName: string;
}

const CORE_NOTIFICATION_EVENTS: NotificationEventCatalogItem[] = [
  {
    pluginId: "core",
    pluginName: "Core",
    eventKey: "reaction",
    label: "Reactions to my posts",
    category: "activity",
    scopes: [],
    defaultInAppEnabled: true,
  },
  {
    pluginId: "core",
    pluginName: "Core",
    eventKey: "comment",
    label: "Comments on my posts",
    category: "activity",
    scopes: [],
    defaultInAppEnabled: true,
  },
  {
    pluginId: "core",
    pluginName: "Core",
    eventKey: "commentReply",
    label: "Replies to my comments",
    category: "activity",
    scopes: [],
    defaultInAppEnabled: true,
  },
  {
    pluginId: "core",
    pluginName: "Core",
    eventKey: "mention",
    label: "Mentions",
    category: "activity",
    scopes: [],
    defaultInAppEnabled: true,
  },
  {
    pluginId: "core",
    pluginName: "Core",
    eventKey: "share",
    label: "Shares of my content",
    category: "activity",
    scopes: [],
    defaultInAppEnabled: true,
  },
  {
    pluginId: "core",
    pluginName: "Core",
    eventKey: "newFollowedUserPost",
    label: "New posts from people I follow",
    category: "activity",
    scopes: [],
    defaultInAppEnabled: true,
  },
  {
    pluginId: "core",
    pluginName: "Core",
    eventKey: "systemAnnouncement",
    label: "System announcements",
    category: "system",
    scopes: [],
    defaultInAppEnabled: true,
  },
];

const normalizeCategory = (
  category: NotificationEventCategory | undefined,
): NotificationEventCategory => category ?? "custom";

export function buildNotificationEventCatalog(): NotificationEventCatalogItem[] {
  const pluginEvents: NotificationEventCatalogItem[] = [];

  for (const plugin of pluginDefinitions as unknown as PluginDefinition[]) {
    const events = plugin.notificationEvents ?? [];
    for (const ev of events) {
      pluginEvents.push({
        ...ev,
        category: normalizeCategory(ev.category),
        pluginId: plugin.id,
        pluginName: plugin.name,
      });
    }
  }

  const byKey = new Map<string, NotificationEventCatalogItem>();
  for (const item of [...CORE_NOTIFICATION_EVENTS, ...pluginEvents]) {
    // First one wins (core can be overridden later if desired by changing order).
    if (!byKey.has(item.eventKey)) byKey.set(item.eventKey, item);
  }

  return Array.from(byKey.values());
}

export function groupCatalogByCategory(
  catalog: NotificationEventCatalogItem[],
): Record<NotificationEventCategory, NotificationEventCatalogItem[]> {
  const result: Record<NotificationEventCategory, NotificationEventCatalogItem[]> =
    {
      activity: [],
      group: [],
      system: [],
      event: [],
      ecommerce: [],
      lms: [],
      custom: [],
    };

  for (const item of catalog) {
    const category = normalizeCategory(item.category);
    result[category].push(item);
  }

  for (const category of Object.keys(result) as NotificationEventCategory[]) {
    result[category].sort((a, b) => a.label.localeCompare(b.label));
  }

  return result;
}


